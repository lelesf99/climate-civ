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
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        this.sessionRef = this.db.collection('sessions').doc(code);
        this.role = 'teacher';

        const sessionData = {
            code: code,
            status: 'waiting', // waiting, active, results, finished
            round: 1,
            scenarioId: null,
            timer: 90,
            players: {}, // [uid]: { name: '', resources: {}, score: 0, submitted: false }
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await this.sessionRef.set(sessionData);
        return code;
    }

    async startNextScenario(scenarioId) {
        await this.sessionRef.update({
            scenarioId: scenarioId,
            status: 'active',
            timer: 90,
            'players': this.resetPlayerSubmissions()
        });
    }

    resetPlayerSubmissions() {
        // In Firestore we can't easily map over the 'players' object in a single update
        // without knowing the keys, so we'll fetch or the game logic will handle it better.
        // For now, let's assume the teacher triggers a reset.
        return {}; // This is a placeholder, implementation will vary
    }

    // --- Player Methods ---

    async joinSession(code, playerName) {
        this.sessionRef = this.db.collection('sessions').doc(code);
        const doc = await this.sessionRef.get();

        if (!doc.exists) throw new Error("Sessão não encontrada.");

        const uid = (await this.login()).uid;
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

    // --- Global Sync ---

    onSessionUpdate(callback) {
        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = this.sessionRef.onSnapshot((doc) => {
            if (doc.exists) {
                callback(doc.data());
            }
        });
    }

    async updateSessionStatus(status) {
        await this.sessionRef.update({ status });
    }
}

window.api = new FirebaseProxy();
