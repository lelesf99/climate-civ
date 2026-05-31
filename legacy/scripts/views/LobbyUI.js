import { api } from '../services/api.js';

export class LobbyUI {
    constructor(game, uiManager) {
        this.game = game;
        this.uiManager = uiManager;
    }

    showRoleSelection() {
        this.uiManager.hideAll();
        this.resetLoginScreenStates();

        document.getElementById('role-screen').classList.remove('hidden');
        document.getElementById('role-screen').classList.add('active');

        // Reset inputs specifically for role selection (clearing values)
        document.querySelectorAll('.retro-input').forEach(input => {
            input.value = '';
        });

        const statusMsg = document.getElementById('login-status-msg');
        if (statusMsg) {
            statusMsg.innerText = "";
            statusMsg.className = "status-msg";
        }

        document.getElementById('session-info').classList.add('hidden');
        document.getElementById('teacher-initial-actions').classList.remove('hidden');
        const backBtn = document.getElementById('back-to-role-btn');
        if (backBtn) backBtn.classList.remove('hidden');

        const sessionsContainer = document.getElementById('teacher-sessions-container');
        if (sessionsContainer) sessionsContainer.classList.remove('hidden');
    }

    renderPlayerLobby(data) {
        this.uiManager.hideAll();
        document.getElementById('player-lobby-screen').classList.remove('hidden');
        document.getElementById('app').classList.remove('clear-app');

        // Find current player continent
        const myUid = this.game.uid;
        const myPlayer = data.players ? data.players[myUid] : null;

        if (myPlayer && myPlayer.continent) {
            const continentDisplay = document.getElementById('lobby-continent-display');
            if (continentDisplay) {
                continentDisplay.innerText = myPlayer.continent;
            }
        }

        const list = document.getElementById('lobby-players-list');
        if (!list) return;

        if (!data.players || Object.keys(data.players).length === 0) {
            list.innerHTML = '<li>Aguardando líderes...</li>';
            return;
        }

        let isWaitingHTML = '';
        if (myPlayer && myPlayer.isWaiting) {
             isWaitingHTML = '<p class="status-msg" style="color:cyan; margin-bottom:1rem;">Partida em andamento. Aguarde o professor reiniciar para entrar nativamente.</p>';
        }

        list.innerHTML = isWaitingHTML + Object.values(data.players).map(p => {
            let statusTag = '';
            const isActive = this.game.isPlayerActive(p);
            
            if (p.isWaiting) statusTag = ' <span style="font-size:0.7em; color:cyan;">(Aguardando)</span>';
            else if (!isActive) statusTag = ' <span style="font-size:0.7em; color:red;">(Desconectado)</span>';

            return `
            <div class="player-card ${!isActive ? 'inactive' : ''}">
                <span class="player-card-name">${p.name}${statusTag}</span>
            </div>
            `;
        }).join('');
    }

    showTeacherLogin() {
        this.uiManager.hideAll();
        this.resetLoginScreenStates();
        document.getElementById('teacher-login-screen').classList.remove('hidden');
    }

    showTeacherSetup() {
        // If setup screen is already active and visible, don't re-run expensive setup and re-render
        const setupScreen = document.getElementById('teacher-setup-screen');
        if (setupScreen && setupScreen.classList.contains('active') && !setupScreen.classList.contains('hidden')) {
            console.log("Teacher setup already active, skipping redundant reload");
            return;
        }

        this.uiManager.hideAll();
        setupScreen.classList.remove('hidden');
        setupScreen.classList.add('active'); // Explicitly mark as active

        // Ensure buttons are in initial state if no session active
        if (!this.game.sessionCode) {
            document.getElementById('session-info').classList.add('hidden');
            document.getElementById('teacher-initial-actions').classList.remove('hidden');
            document.getElementById('teacher-sessions-container').classList.remove('hidden');
            this.loadTeacherSessions();
        }
        // Show logoff button
        document.getElementById('teacher-controls').classList.remove('hidden');
    }

    async loadTeacherSessions() {
        const loading = document.getElementById('sessions-loading');
        try {
            if (loading) loading.classList.remove('hidden');
            const sessions = await api.getTeacherSessions();
            this.renderTeacherSessions(sessions);
        } catch (e) {
            console.error("Error loading sessions:", e);
        } finally {
            if (loading) loading.classList.add('hidden');
        }
    }

    renderTeacherSessions(sessions) {
        const list = document.getElementById('teacher-sessions-list');
        if (!list) return;

        if (!sessions || sessions.length === 0) {
            list.innerHTML = '<p class="empty-msg">Nenhuma sessão ativa encontrada.</p>';
            return;
        }

        list.innerHTML = sessions.map(s => {
            let date = 'Data desconhecida';
            if (s.createdAt) {
                const ts = typeof s.createdAt === 'number' ? s.createdAt : (s.createdAt.toMillis ? s.createdAt.toMillis() : s.createdAt);
                date = new Date(ts).toLocaleString('pt-BR');
            }
            const playerCount = Object.keys(s.players || {}).length;

            return `
                <div class="session-item">
                    <div class="session-info-cols">
                        <span class="session-id">MISSÃO ${s.id}</span>
                        <span class="session-date">${playerCount} LÍDERES | ${date}</span>
                    </div>
                    <div class="session-actions">
                        <button class="retro-btn small-btn reconnect-btn reconnect-session-btn" data-code="${s.id}"><span class="material-symbols-outlined">wifi_tethering</span> RECONECTAR</button>
                        <button class="retro-btn small-btn retro-btn-danger delete-session-btn" data-code="${s.id}"><span class="material-symbols-outlined">delete</span></button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showPlayerJoin() {
        this.uiManager.hideAll();
        this.resetLoginScreenStates();
        document.getElementById('player-join-screen').classList.remove('hidden');
    }

    resetLoginScreenStates() {
        // Re-enable all entry/back buttons
        const ids = [
            'login-submit-btn', 'back-from-login-btn',
            'join-session-btn', 'back-to-role-btn'
        ];
        ids.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });

        // Reset status messages
        const loginStatus = document.getElementById('login-status-msg');
        if (loginStatus) {
            loginStatus.innerText = "";
            loginStatus.className = "status-msg";
        }
        const joinStatus = document.getElementById('join-status');
        if (joinStatus) {
            joinStatus.innerText = "";
            joinStatus.className = "";
        }

        // Clear validation and inputs
        document.querySelectorAll('.retro-input').forEach(input => {
            // No reset value here as we might want to keep the email/name
            input.classList.remove('valid', 'invalid');
            input.removeAttribute('aria-invalid');
        });

        // Hide loading bars
        const loaders = ['login-loading', 'create-loading', 'sessions-loading'];
        loaders.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    }

    showPlayerLobby() {
        this.uiManager.hideAll();
        document.getElementById('player-lobby-screen').classList.remove('hidden');
    }

    updateSessionDisplay(code) {
        document.getElementById('teacher-initial-actions').classList.add('hidden');
        document.getElementById('teacher-sessions-container').classList.add('hidden');
        document.getElementById('session-info').classList.remove('hidden');
        document.getElementById('session-code-display').innerText = code;
    }
}
