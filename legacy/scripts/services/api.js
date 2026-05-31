import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

/**
 * Firebase API Wrapper for Climate Civ
 * Handles Authentication and RTDB/Firestore sync for multiplayer sessions.
 */
export class FirebaseProxy {
    constructor() {
        this.auth = null;
        this.rtdb = null;
        this.sessionRef = null;
        this.unsubscribe = null;
        this.role = null; // 'teacher' or 'player'
        this.onAuthCallback = null;
    }

    async init(config) {
        // Use global config if not provided, for easy integration with external scripts
        const finalConfig = config && Object.keys(config).length > 0 ? config : window.FIREBASE_CONFIG;

        if (!finalConfig) {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            let msg = "Configuração do Firebase não encontrada.\n";
            msg += isLocal 
                ? "O arquivo 'scripts/firebase-config.js' parece não ter carregado ou não define window.FIREBASE_CONFIG."
                : "O GitHub Secret 'FIREBASE_CONFIG' pode estar faltando.";
            throw new Error(msg);
        }

        if (!finalConfig.apiKey) {
            throw new Error("Configuração do Firebase incompleta (apiKey faltando).");
        }

        firebase.initializeApp(finalConfig);
        this.auth = firebase.auth();
        
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) {
            try {
                await this.auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
            } catch (e) {
                console.warn("Failed to set SESSION persistence for local testing:", e);
            }
        }

        try {
            this.rtdb = firebase.database();
        } catch(e) {
            console.warn("RTDB Init failed, attempting with explicit URL fallback...", e);
            if (!finalConfig.databaseURL && finalConfig.projectId) {
                const app = firebase.app();
                this.rtdb = app.database(`https://${finalConfig.projectId}-default-rtdb.firebaseio.com`);
            }
        }
    }

    onAuthStateChanged(callback) {
        this.onAuthCallback = callback;
        if (!this.auth) {
            console.warn("api.onAuthStateChanged called before api.init(). Waiting...");
            return null;
        }
        return this.auth.onAuthStateChanged((user) => {
            if (callback) callback(user);
        });
    }

    async loginAnonymously() {
        try {
            if (this.auth.currentUser) return this.auth.currentUser;
            const user = await this.auth.signInAnonymously();
            return user.user;
        } catch (error) {
            console.error("Anonymous Auth error:", error);
            throw error;
        }
    }

    async loginTeacher(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            console.error("Teacher Auth error:", error);
            throw error;
        }
    }

    async logout() {
        try {
            if (!this.auth) return;
            this.stopSessionSync();
            await this.auth.signOut();
            this.role = null;
        } catch (error) {
            console.error("Logout error in api.js:", error);
        }
    }

    stopSessionSync() {
        if (this.sessionRef && this.unsubscribe) {
            this.sessionRef.off('value', this.unsubscribe);
            this.unsubscribe = null;
        }
        this.sessionRef = null;
    }

    // --- Teacher Methods ---

    async createSession() {
        const user = this.auth.currentUser;
        if (!user) throw new Error("Acesso negado: Professor não autenticado.");

        const code = Math.floor(1000 + Math.random() * 9000).toString();
        this.sessionRef = this.rtdb.ref(`sessions/${code}`);
        this.role = 'teacher';

        const sessionData = {
            code: code,
            hostId: user.uid,
            status: 'waiting',
            round: 1,
            scenarioId: null,
            timer: 90,
            players: {}, 
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        await this.sessionRef.set(sessionData);
        // Presence is now strictly handled by RTDB onDisconnect rule on players
        return code;
    }

    async reconnectSession(code) {
        this.sessionRef = this.rtdb.ref(`sessions/${code}`);
        const doc = await this.sessionRef.once('value');

        if (!doc.exists()) {
            throw new Error("Sessão ativa não encontrada no Realtime Database.");
        }

        this.role = 'teacher';
        return code;
    }

    async getTeacherSessions() {
        const user = this.auth.currentUser;
        if (!user) return [];

        // Fetch active/finished sessions from RTDB
        const rtdbSnap = await this.rtdb.ref('sessions')
            .orderByChild('hostId')
            .equalTo(user.uid)
            .once('value');

        const actives = [];
        if (rtdbSnap.exists()) {
            rtdbSnap.forEach(child => {
                actives.push({
                    id: child.key,
                    ...child.val()
                });
            });
        }

        return actives.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    async deleteSessionByCode(code) {
        // Active session stop
        if (this.sessionRef && this.sessionRef.key === code) {
            this.stopSessionSync();
            this.role = null;
        }
        // Remove from RTDB (active)
        try {
            await this.rtdb.ref(`sessions/${code}`).remove();
        } catch (error) {
            console.warn(`Could not delete session ${code} from RTDB (maybe already deleted or no permission):`, error);
        }
    }

    async startNextScenario(assignments = {}, round, allPlayersData = {}) {
        const updates = {
            status: 'active',
            timer: 90
        };
        if (round) updates.round = round;

        // 1. Broad reset for ALL players in the room (prevents "stuck" states)
        for (const uid in allPlayersData) {
            updates[`players/${uid}/submitted`] = false;
            updates[`players/${uid}/resources`] = {};
            updates[`players/${uid}/readyToRestart`] = false;
            updates[`players/${uid}/isWaiting`] = false;
        }

        // 2. Specific assignments for this round
        for (const uid in assignments) {
            updates[`players/${uid}/currentScenarioId`] = assignments[uid];
        }

        await this.sessionRef.update(updates);
    }

    async resetSession(playerUids = [], allPlayersData = {}) {
        const updates = {
            status: 'waiting',
            round: 1,
            scenarioId: null,
            timer: 90
        };

        playerUids.forEach(uid => {
            const p = allPlayersData[uid] || {};
            if (p.isActive === false) {
                // Delete player from RTDB by setting to null
                updates[`players/${uid}`] = null;
            } else {
                updates[`players/${uid}/score`] = 0;
                updates[`players/${uid}/submitted`] = false;
                updates[`players/${uid}/resources`] = {};
                updates[`players/${uid}/readyToRestart`] = false;
                updates[`players/${uid}/history`] = [];
                updates[`players/${uid}/difficulty`] = 'good';
                updates[`players/${uid}/currentScenarioId`] = null;
                updates[`players/${uid}/isWaiting`] = false;
            }
        });

        await this.sessionRef.update(updates);
    }

    async cancelSession() {
        if (this.sessionRef) {
            try {
                await this.sessionRef.remove();
                this.sessionRef = null;
            } catch (error) {
                throw new Error('Erro ao cancelar sessão: ' + error.message);
            }
        }
    }


    // --- Player Methods ---

    async joinSession(code, playerName) {
        // Authenticate anonymously FIRST, before checking rules-protected RTDB nodes
        const uid = (await this.loginAnonymously()).uid;
        
        this.sessionRef = this.rtdb.ref(`sessions/${code}`);
        const doc = await this.sessionRef.once('value');

        if (!doc.exists()) throw new Error("Sessão não encontrada.");

        const sessionData = doc.val();
        
        if (sessionData.players && sessionData.players[uid]) {
            this.role = 'player';
            await this.sessionRef.child(`players/${uid}`).update({
                isActive: true
            });
            this.setupPresence(code, uid);
            return { code, uid };
        }

        const currentPlayerCount = Object.keys(sessionData.players || {}).length;
        const MAX_PLAYERS = 6;

        if (currentPlayerCount >= MAX_PLAYERS) {
            throw new Error(`Sessão cheia! Máximo de ${MAX_PLAYERS} jogadores.`);
        }

        const isWaiting = sessionData.status !== 'waiting';
        this.role = 'player';

        await this.sessionRef.child(`players/${uid}`).set({
            name: playerName.toUpperCase(),
            score: 0,
            submitted: false,
            resources: {},
            isActive: true,
            isWaiting: isWaiting
        });

        this.setupPresence(code, uid);
        return { code, uid };
    }

    async submitAllocation(uid, resources, timeLeft) {
        await this.sessionRef.child(`players/${uid}`).update({
            resources: resources,
            submitted: true,
            timeLeft: timeLeft
        });
    }

    async leaveSession(uid) {
        if (!this.sessionRef) return;
        const ref = this.sessionRef;
        this.stopSessionSync();
        this.role = null;

        await ref.child(`players/${uid}`).update({
            isActive: false
        });
    }

    async signalRestartReady(uid, status) {
        await this.sessionRef.child(`players/${uid}`).update({
            readyToRestart: status
        });
    }

    // --- Global Sync ---

    onSessionUpdate(callback) {
        if (this.unsubscribe && this.sessionRef) {
            this.sessionRef.off('value', this.unsubscribe);
        }
        
        this.unsubscribe = (snap) => {
            if (snap.exists()) {
                callback(snap.val());
            } else {
                callback(null);
            }
        };

        this.sessionRef.on('value', this.unsubscribe);
    }

    async updateSessionStatus(status) {
        await this.sessionRef.update({ status });
    }

    async archiveSession(sessionData) {
        if (!this.sessionRef) return;
        // Just mark as finished in RTDB for now, teacher can manually delete later.
        await this.sessionRef.update({ status: 'finished' });
    }

    // --- Presence System (RTDB Native) ---

    setupPresence(code, uid) {
        if (!this.rtdb) return;

        const connectedRef = this.rtdb.ref('.info/connected');
        const connectionsRef = this.rtdb.ref(`sessions/${code}/players/${uid}/connections`);

        connectedRef.on('value', (snap) => {
            if (snap.val() === true) {
                const con = connectionsRef.push();
                con.onDisconnect().remove().then(() => {
                    con.set(true);
                });
            }
        });
    }
}

export const api = new FirebaseProxy();
