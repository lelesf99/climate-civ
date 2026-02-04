/**
 * Firebase API Wrapper for Climate Civ
 * Handles Authentication and Firestore sync for multiplayer sessions.
 */
class FirebaseProxy {
    constructor() {
        this.db = null;
        this.auth = null;
        this.sessionRef = null;
        this.unsubscribe = null;
        this.role = null; // 'teacher' or 'player'
    }

    async init(config) {
        // Use global config if not provided, for easy integration with external scripts
        console.log("Detectando configuração do Firebase...", window.FIREBASE_CONFIG);
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

        if (!window.firebase) {
            console.error("Firebase SDK not found!");
            return;
        }

        firebase.initializeApp(finalConfig);
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    async login() {
        try {
            const user = await this.auth.signInAnonymously();
            return user.user;
        } catch (error) {
            console.error("Auth error:", error);
        }
    }

    // --- Teacher Methods ---

    async createSession() {
        const user = await this.login();
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
        console.log('Cancelando sessão...', this.sessionRef);
        if (this.sessionRef) {
            try {
                await this.sessionRef.delete();
                console.log('Sessão deletada do Firestore');
                this.sessionRef = null;
                this.role = null;
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

        const uid = (await this.login()).uid;
        this.role = 'player';
        console.log(uid);

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
        await this.sessionRef.update({
            [`players.${uid}`]: firebase.firestore.FieldValue.delete()
        });
        this.sessionRef = null;
        this.role = null;
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

window.api = new FirebaseProxy();
