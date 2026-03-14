import { api } from '../services/api.js';
import { store, GamePhase, Role } from '../store/gameState.js';

export class SessionManager {
    constructor(game) {
        this.game = game;
    }

    async createSession() {
        try {
            store.setLoading(true);
            const sessionCode = await api.createSession();
            
            store.setRole(Role.TEACHER);
            store.setSession(sessionCode);
            store.setPhase(GamePhase.TEACHER_SETUP);
            
            api.onSessionUpdate((data) => {
                store.updateSessionData(data);
            });
        } catch (e) {
            store.emitError(e.message);
        } finally {
            store.setLoading(false);
        }
    }

    async reconnectSession(code) {
        try {
            store.setLoading(true);
            const sessionCode = await api.reconnectSession(code);
            
            store.setRole(Role.TEACHER);
            store.setSession(sessionCode);
            store.setPhase(GamePhase.TEACHER_SETUP);

            api.onSessionUpdate((data) => {
                store.updateSessionData(data);
            });
        } catch (e) {
            store.emitError(e.message);
        } finally {
            store.setLoading(false);
        }
    }

    async handleDeleteSession(code) {
        try {
            store.setLoading(true);
            await api.deleteSessionByCode(code);
            store.refreshSessions$.next();
            store.emitNotification(`Sessão ${code} deletada`);
        } catch (e) {
            store.emitError(e.message);
        } finally {
            store.setLoading(false);
        }
    }

    async joinMission(code, name) {
        try {
            store.setLoading(true);
            const { uid } = await api.joinSession(code, name);
            
            store.setRole(Role.PLAYER);
            store.setUid(uid);
            store.setSession(code);
            
            const storage = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? sessionStorage : localStorage;
            storage.setItem('climateCivSessionCode', code);
            
            api.setupPresence(code, uid);

            setTimeout(() => {
                store.setPhase(GamePhase.LOBBY);
                api.onSessionUpdate((data) => {
                    store.updateSessionData(data);
                    this.game.handleSync(data);
                });
                store.setLoading(false);
            }, 1000);
        } catch (e) {
            store.emitError(e.message);
            store.setLoading(false);
        }
    }

    async leaveMission() {
        try {
            store.setLoading(true);
            await api.leaveSession(store.uid);
            
            sessionStorage.removeItem('climateCivSessionCode');
            localStorage.removeItem('climateCivSessionCode');
            store.reset();
            store.setPhase(GamePhase.PLAYER_JOIN);
        } catch (e) {
            store.emitError(e.message);
        } finally {
            store.setLoading(false);
        }
    }

    async cancelSession() {
        try {
            store.setLoading(true);
            await api.cancelSession();
            store.reset();
            store.setRole(Role.TEACHER); // Keeps the user in teacher view
            store.setPhase(GamePhase.TEACHER_SETUP);
        } catch (e) {
            store.emitError(e.message);
        } finally {
            store.setLoading(false);
        }
    }

    async reconnectPlayer(code, uid) {
        try {
            store.setLoading(true);
            api.sessionRef = api.rtdb.ref(`sessions/${code}`);
            const snap = await api.sessionRef.once('value');
            
            if (!snap.exists()) {
                this._clearLocalSession();
                return;
            }

            const sessionData = snap.val();
            if (sessionData.players && sessionData.players[uid]) {
                await api.sessionRef.child(`players/${uid}`).update({
                    isActive: true
                });

                api.setupPresence(code, uid);
                
                store.setRole(Role.PLAYER);
                store.setUid(uid);
                store.setSession(code, sessionData);
                store.setPhase(GamePhase.LOBBY);

                api.onSessionUpdate((data) => {
                    store.updateSessionData(data);
                    this.game.handleSync(data);
                });
            } else {
                this._clearLocalSession();
            }
        } catch (e) {
            console.error("Auto reconnect falhou:", e);
            this._clearLocalSession();
        } finally {
            store.setLoading(false);
        }
    }
    
    _clearLocalSession() {
        sessionStorage.removeItem('climateCivSessionCode');
        localStorage.removeItem('climateCivSessionCode');
        store.setPhase(GamePhase.ROLE_SELECTION);
    }
}
