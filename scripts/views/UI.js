import { LobbyUI } from './LobbyUI.js';
import { GameUI } from './GameUI.js';
import { ResultsUI } from './ResultsUI.js';
import { store, GamePhase, Role } from '../store/gameState.js';

export class UI {
    constructor(game) {
        this.game = game;
        this.lastSoundRound = 0;

        // Initialize Sub-modules
        this.lobbyUI = new LobbyUI(game, this);
        this.gameUI = new GameUI(game, this);
        this.resultsUI = new ResultsUI(game, this);

        this.initEventListeners();
        this.initReactiveStore();
    }

    initReactiveStore() {
        store.loading$.subscribe(isLoading => {
            const loaders = ['login-loading', 'create-loading', 'sessions-loading'];
            loaders.forEach(id => {
                const el = document.getElementById(id);
                if (el) isLoading ? el.classList.remove('hidden') : el.classList.add('hidden');
            });
            
            const btns = ['login-submit-btn', 'back-from-login-btn', 'join-session-btn', 'back-to-role-btn', 'create-session-btn'];
            btns.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.disabled = isLoading;
            });
        });

        store.phase$.subscribe(phase => {
            if (phase === GamePhase.ROLE_SELECTION) this.showRoleSelection();
            else if (phase === GamePhase.PLAYER_JOIN) this.showPlayerJoin();
            else if (phase === GamePhase.TEACHER_SETUP) this.showTeacherSetup();
            else if (phase === GamePhase.LOBBY) this.showPlayerLobby();
        });

        store.errors$.subscribe(err => {
            alert("Erro: " + err);
        });

        store.notifications$.subscribe(msg => {
            // Can be a toast later
            alert(msg);
        });

        store.refreshSessions$.subscribe(() => {
            this.loadTeacherSessions();
        });
    }

    initEventListeners() {
        // Global Click Sound
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                this.game.audio.play('click');
            }
        });

        // Role Selection
        document.getElementById('teacher-role-btn').addEventListener('click', () => this.game.selectRole('teacher'));
        document.getElementById('player-role-btn').addEventListener('click', () => this.game.selectRole('player'));

        // Teacher Login
        const loginSubmitBtn = document.getElementById('login-submit-btn');
        if (loginSubmitBtn) {
            loginSubmitBtn.addEventListener('click', () => {
                const emailInput = document.getElementById('teacher-email');
                const passInput = document.getElementById('teacher-password');

                if (emailInput.classList.contains('invalid') || passInput.classList.contains('invalid')) {
                    alert("Por favor, corrija os erros nos campos destacados.");
                    return;
                }

                const email = emailInput.value;
                const password = passInput.value;

                if (email && password) {
                    this.game.handleTeacherLogin(email, password);
                } else {
                    alert("Por favor, insira e-mail e senha.");
                }
            });
        }

        const backFromLoginBtn = document.getElementById('back-from-login-btn');
        if (backFromLoginBtn) {
            backFromLoginBtn.addEventListener('click', () => this.showRoleSelection());
        }

        // Return to selection
        document.querySelectorAll('.return-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showRoleSelection());
        });

        const cancelBtn = document.getElementById('cancel-session-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.game.sessionManager.cancelSession());
        }

        // Teacher Setup
        const createBtn = document.getElementById('create-session-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.game.sessionManager.createSession());
        }

        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.game.startMission());
        }

        const playerJoinBtn = document.getElementById('join-session-btn');
        if (playerJoinBtn) {
            playerJoinBtn.addEventListener('click', () => {
                const code = document.getElementById('join-code-input').value;
                const name = document.getElementById('player-name-input').value;
                if (code.length === 4 && name.length >= 2) {
                    this.game.sessionManager.joinMission(code, name);
                } else {
                    alert("Insira um código de 4 dígitos e um nome com pelo menos 2 letras.");
                }
            });
        }

        const leaveBtn = document.getElementById('leave-session-btn');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => this.game.sessionManager.leaveMission());
        }

        // Session List Actions (Delegation)
        const sessionList = document.getElementById('teacher-sessions-list');
        if (sessionList) {
            sessionList.addEventListener('click', (e) => {
                // Find nearest button with the specific class
                const reconnectBtn = e.target.closest('.reconnect-session-btn');
                const deleteBtn = e.target.closest('.delete-session-btn');

                if (reconnectBtn) {
                    const code = reconnectBtn.dataset.code;
                    console.warn("RECONNECT CLICKED:", code);
                    this.game.sessionManager.reconnectSession(code);
                }

                if (deleteBtn) {
                    const code = deleteBtn.dataset.code;
                    console.warn("DELETE CLICKED:", code);
                    this.game.sessionManager.handleDeleteSession(code);
                }
            });
        }

        const logoutBtn = document.getElementById('teacher-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.game.handleLogout();
            });
        }


        // Player Submission
        const submitBtn = document.getElementById('submit-allocation-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const allocations = this.getCurrentAllocations();
                this.game.submitAllocation(allocations);
            });
        }

        // Spacebar shortcut for Presidential Button
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && submitBtn && !submitBtn.disabled) {
                const resourceScreen = document.getElementById('resource-allocation-container');
                if (resourceScreen && !resourceScreen.classList.contains('hidden')) {
                    e.preventDefault(); // Prevent page scroll
                    submitBtn.click();
                }
            }
        });

        // Mute
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const isMuted = this.game.audio.toggleMute();
                muteBtn.innerText = isMuted ? '🔇' : '🔊';
            });
        }

        // Restart flow
        const playerReadyBtn = document.getElementById('player-ready-btn');
        if (playerReadyBtn) {
            playerReadyBtn.addEventListener('click', () => this.game.toggleRestartReady());
        }

        const teacherRestartBtn = document.getElementById('teacher-restart-btn');
        if (teacherRestartBtn) {
            teacherRestartBtn.addEventListener('click', () => this.game.teacherRestart());
        }

        // Next Round button
        const nextRoundBtn = document.getElementById('next-round-btn');
        if (nextRoundBtn) {
            nextRoundBtn.addEventListener('click', () => this.game.advanceFromResults());
        }

        // Real-time Validation
        const emailInput = document.getElementById('teacher-email');
        const passInput = document.getElementById('teacher-password');

        const validateEmail = (email) => {
            return String(email)
                .toLowerCase()
                .match(
                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                );
        };

        if (emailInput) {
            emailInput.addEventListener('input', () => {
                const isValid = validateEmail(emailInput.value);
                const hasValue = emailInput.value.length > 0;
                emailInput.classList.toggle('invalid', hasValue && !isValid);
                emailInput.classList.toggle('valid', hasValue && isValid);
                emailInput.setAttribute('aria-invalid', hasValue && !isValid);
            });
        }

        if (passInput) {
            passInput.addEventListener('input', () => {
                const isValid = passInput.value.length >= 6;
                const hasValue = passInput.value.length > 0;
                passInput.classList.toggle('invalid', hasValue && !isValid);
                passInput.classList.toggle('valid', hasValue && isValid);
                passInput.setAttribute('aria-invalid', hasValue && !isValid);
            });
        }

        // Student Join Validation
        const joinCodeInput = document.getElementById('join-code-input');
        const playerNameInput = document.getElementById('player-name-input');

        if (joinCodeInput) {
            joinCodeInput.addEventListener('input', () => {
                const isValid = joinCodeInput.value.length === 4;
                const hasValue = joinCodeInput.value.length > 0;
                joinCodeInput.classList.toggle('invalid', hasValue && !isValid);
                joinCodeInput.classList.toggle('valid', hasValue && isValid);
                joinCodeInput.setAttribute('aria-invalid', hasValue && !isValid);
            });
        }

        if (playerNameInput) {
            playerNameInput.addEventListener('input', () => {
                const isValid = playerNameInput.value.length >= 3;
                const hasValue = playerNameInput.value.length > 0;
                playerNameInput.classList.toggle('invalid', hasValue && !isValid);
                playerNameInput.classList.toggle('valid', hasValue && isValid);
                playerNameInput.setAttribute('aria-invalid', hasValue && !isValid);
            });
        }
    }

    // --- DELEGATE TO MODULES ---

    showRoleSelection() { this.lobbyUI.showRoleSelection(); }
    showTeacherLogin() { this.lobbyUI.showTeacherLogin(); }
    showTeacherSetup() { this.lobbyUI.showTeacherSetup(); }
    showPlayerJoin() { this.lobbyUI.showPlayerJoin(); }
    showPlayerLobby() { this.lobbyUI.showPlayerLobby(); }
    renderPlayerLobby(data) { this.lobbyUI.renderPlayerLobby(data); }
    updateSessionDisplay(code) { this.lobbyUI.updateSessionDisplay(code); }
    loadTeacherSessions() { this.lobbyUI.loadTeacherSessions(); }

    renderTeacherDashboard(data) { this.gameUI.renderTeacherDashboard(data); }
    renderStatusCard(continent) { this.gameUI.renderStatusCard(continent); }
    updateNewsFeed(specificContinent = null) { this.gameUI.updateNewsFeed(specificContinent); }
    showTeacherGame(sessionCode) { this.gameUI.showTeacherGame(sessionCode); }
    showPlayerInteraction(scenario) { this.gameUI.showPlayerInteraction(scenario); }
    getCurrentAllocations() { return this.gameUI.getCurrentAllocations(); }
    showPlayerWait(message) { this.gameUI.showPlayerWait(message); }

    showRoundResults(sessionData, player) { this.resultsUI.showRoundResults(sessionData, player); }
    showTeacherResults(data) { this.resultsUI.showTeacherResults(data); }
    renderEndScreen(data) { this.resultsUI.renderEndScreen(data); }

    // --- SHARED UTILS ---

    updateTimer(seconds) {
        const timeStr = `${seconds}`;
        const t2 = document.getElementById('player-timer-display');
        if (t2) t2.innerText = timeStr;
    }

    hideAll() {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });
        // Ensure teacher controls are hidden unless explicitly shown by a screen
        const controls = document.getElementById('teacher-controls');
        if (controls) controls.classList.add('hidden');

        // Remove clear class from app unless specifically needed
        document.getElementById('app').classList.remove('clear-app');
    }
}
