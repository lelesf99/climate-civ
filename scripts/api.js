import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

/**
 * Firebase API Wrapper for Climate Civ
 * Handles Authentication and Firestore sync for multiplayer sessions.
 */
export class FirebaseProxy {
    constructor() {
        this.db = null;
        this.auth = null;
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
            let msg = "Aviso: Configuração do Firebase não encontrada.\n\n";
            if (isLocal) {
                msg += "LOCAL: O arquivo 'scripts/firebase-config.js' parece não ter carregado ou não define window.FIREBASE_CONFIG.";
            } else {
                msg += "DEPLOY: O arquivo 'scripts/firebase-config.js' está faltando ou vazio. Verifique se o GitHub Secret 'FIREBASE_CONFIG' foi definido.";
            }
            console.error(msg);
            alert(msg);
            return;
        }

        if (!finalConfig.apiKey) {
            console.error("Configuração encontrada, mas 'apiKey' está ausente.", finalConfig);
            alert("Aviso: Configuração do Firebase incompleta (apiKey faltando).");
            return;
        }

        // window.firebase check is not needed since we import it

        firebase.initializeApp(finalConfig);
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    onAuthStateChanged(callback) {
        this.onAuthCallback = callback;
        if (!this.auth) {
            console.warn("api.onAuthStateChanged called before api.init(). Waiting...");
            return null; // Or we could queue it, but usually Game.init should wait
        }
        return this.auth.onAuthStateChanged((user) => {
            if (callback) callback(user);
        });
    }

    async loginAnonymously() {
        try {
            // If already logged in (as any provider), just return the user
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
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.sessionRef = null;
    }

    // --- Teacher Methods ---

    async createSession() {
        const user = this.auth.currentUser;
        if (!user) throw new Error("Acesso negado: Professor não autenticado.");

        const code = Math.floor(1000 + Math.random() * 9000).toString();
        this.sessionRef = this.db.collection('sessions').doc(code);
        this.role = 'teacher';

        const sessionData = {
            code: code,
            hostId: user.uid,
            status: 'waiting', // waiting, active, results, finished
            round: 1,
            scenarioId: null,
            timer: 90,
            players: {}, // [uid]: { name: '', resources: {}, score: 0, submitted: false }
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            // TTL: Delete session after 24 hours (for cleanup)
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };

        await this.sessionRef.set(sessionData);
        return code;
    }

    async reconnectSession(code) {
        this.sessionRef = this.db.collection('sessions').doc(code);
        const doc = await this.sessionRef.get();

        if (!doc.exists) {
            throw new Error("Sessão não encontrada.");
        }

        this.role = 'teacher';
        return code;
    }

    async getTeacherSessions() {
        const user = this.auth.currentUser;
        if (!user) return [];

        const snapshot = await this.db.collection('sessions')
            .where('hostId', '==', user.uid)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    }

    async deleteSessionByCode(code) {
        // If this is the active session, stop sync first
        if (this.sessionRef && this.sessionRef.id === code) {
            this.stopSessionSync();
            this.role = null;
        }
        await this.db.collection('sessions').doc(code).delete();
    }

    async startNextScenario(assignments = {}, round) {
        const updates = {
            status: 'active',
            timer: 90
        };
        if (round) updates.round = round;

        // assignments: { [uid]: scenarioId }
        for (const uid in assignments) {
            updates[`players.${uid}.currentScenarioId`] = assignments[uid];
            updates[`players.${uid}.submitted`] = false;
            updates[`players.${uid}.resources`] = {};
            updates[`players.${uid}.readyToRestart`] = false;
        }

        await this.sessionRef.update(updates);
    }

    async resetSession(playerUids = []) {
        const updates = {
            status: 'waiting',
            round: 1,
            scenarioId: null,
            timer: 90
        };

        playerUids.forEach(uid => {
            updates[`players.${uid}.score`] = 0;
            updates[`players.${uid}.submitted`] = false;
            updates[`players.${uid}.resources`] = {};
            updates[`players.${uid}.readyToRestart`] = false;
            updates[`players.${uid}.history`] = [];
            updates[`players.${uid}.difficulty`] = 'good';
            updates[`players.${uid}.currentScenarioId`] = null;
        });

        await this.sessionRef.update(updates);
    }

    async cancelSession() {
        if (this.sessionRef) {
            try {
                await this.sessionRef.delete();
                this.sessionRef = null;
                // Preserve role so UI knows we are still a teacher
            } catch (error) {
                console.error('Erro ao deletar sessão:', error);
                alert('Erro ao cancelar sessão: ' + error.message);
            }
        } else {
            console.warn('Nenhuma sessão ativa para cancelar');
        }
    }


    // --- Player Methods ---

    async joinSession(code, playerName) {
        this.sessionRef = this.db.collection('sessions').doc(code);
        const doc = await this.sessionRef.get();

        if (!doc.exists) throw new Error("Sessão não encontrada.");

        // Check player limit
        const sessionData = doc.data();
        const currentPlayerCount = Object.keys(sessionData.players || {}).length;
        const MAX_PLAYERS = 6;

        if (currentPlayerCount >= MAX_PLAYERS) {
            throw new Error(`Sessão cheia! Máximo de ${MAX_PLAYERS} jogadores.`);
        }

        const uid = (await this.loginAnonymously()).uid;
        this.role = 'player';

        await this.sessionRef.update({
            [`players.${uid}`]: {
                name: playerName.toUpperCase(),
                score: 0,
                submitted: false,
                resources: {} // Allocation for current scenario
            }
        });

        return { code, uid };
    }

    async submitAllocation(uid, resources) {
        await this.sessionRef.update({
            [`players.${uid}.resources`]: resources,
            [`players.${uid}.submitted`]: true
        });
    }

    async leaveSession(uid) {
        if (!this.sessionRef) return;
        const ref = this.sessionRef;
        this.stopSessionSync();
        this.role = null;

        await ref.update({
            [`players.${uid}`]: firebase.firestore.FieldValue.delete()
        });
    }

    async signalRestartReady(uid, status) {
        await this.sessionRef.update({
            [`players.${uid}.readyToRestart`]: status
        });
    }

    // --- Global Sync ---

    onSessionUpdate(callback) {
        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = this.sessionRef.onSnapshot((doc) => {
            if (doc.exists) {
                callback(doc.data());
            } else {
                callback(null); // Session deleted
            }
        });
    }

    async updateSessionStatus(status) {
        await this.sessionRef.update({ status });
    }
}

export const api = new FirebaseProxy();
