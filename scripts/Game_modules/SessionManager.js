import { api } from '../api.js';

export class SessionManager {
    constructor(game) {
        this.game = game;
    }

    async createSession() {
        const createBtn = document.getElementById('create-session-btn');
        const backBtn = document.getElementById('back-to-role-btn');
        const loading = document.getElementById('create-loading');

        try {
            if (createBtn) createBtn.disabled = true;
            if (backBtn) backBtn.disabled = true;
            if (loading) loading.classList.remove('hidden');

            const sessionCode = await api.createSession();
            this.game.sessionCode = sessionCode;
            this.game.ui.updateSessionDisplay(sessionCode);
            api.onSessionUpdate((data) => this.game.handleSync(data));
        } catch (e) {
            alert(e.message);
            if (createBtn) createBtn.disabled = false;
            if (backBtn) backBtn.disabled = false;
        } finally {
            if (loading) loading.classList.add('hidden');
        }
    }

    async reconnectSession(code) {
        const loading = document.getElementById('sessions-loading');

        try {
            if (loading) loading.classList.remove('hidden');

            const sessionCode = await api.reconnectSession(code);
            this.game.sessionCode = sessionCode;
            this.game.role = 'teacher';
            this.game.ui.updateSessionDisplay(sessionCode);

            api.onSessionUpdate((data) => this.game.handleSync(data));
        } catch (e) {
            alert(e.message);
        } finally {
            if (loading) loading.classList.add('hidden');
        }
    }

    async handleDeleteSession(code) {
        if (!confirm(`Tem certeza que deseja deletar a sessão ${code}?`)) return;

        const loading = document.getElementById('sessions-loading');
        try {
            if (loading) loading.classList.remove('hidden');
            await api.deleteSessionByCode(code);
            this.game.ui.loadTeacherSessions();
        } catch (e) {
            alert(e.message);
        } finally {
            if (loading) loading.classList.add('hidden');
        }
    }

    async joinMission(code, name) {
        const joinBtn = document.getElementById('join-session-btn');
        const backBtn = document.getElementById('back-to-role-btn');
        const statusEl = document.getElementById('join-status');

        try {
            if (joinBtn) joinBtn.disabled = true;
            if (backBtn) backBtn.disabled = true;
            if (statusEl) {
                statusEl.innerText = "Conectando...";
                statusEl.className = "";
            }

            const { uid } = await api.joinSession(code, name);
            this.game.uid = uid;
            this.game.sessionCode = code;

            if (statusEl) {
                statusEl.innerText = "CONECTADO COM SUCESSO!";
                statusEl.classList.add('success');
            }

            setTimeout(() => {
                this.game.ui.showPlayerLobby();
                api.onSessionUpdate((data) => this.game.handleSync(data));
            }, 1000);
        } catch (e) {
            alert(e.message);
            if (joinBtn) joinBtn.disabled = false;
            if (backBtn) backBtn.disabled = false;
            if (statusEl) {
                statusEl.innerText = "";
                statusEl.className = "";
            }
        }
    }

    async leaveMission() {
        if (!confirm("Tem certeza que deseja sair desta sessão?")) return;
        try {
            await api.leaveSession(this.game.uid);
            this.game.uid = null;
            this.game.sessionCode = null;

            const joinBtn = document.getElementById('join-session-btn');
            const backBtn = document.getElementById('back-to-role-btn');
            const statusEl = document.getElementById('join-status');
            if (joinBtn) joinBtn.disabled = false;
            if (backBtn) backBtn.disabled = false;
            if (statusEl) {
                statusEl.innerText = "";
                statusEl.className = "";
            }

            this.game.ui.showPlayerJoin();
        } catch (e) {
            alert(e.message);
        }
    }

    async cancelSession() {
        if (confirm("Tem certeza que deseja encerrar a sessão? Todos os jogadores serão desconectados.")) {
            await api.cancelSession();
        }
    }
}
