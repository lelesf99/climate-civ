import { api } from './api.js';
import { GAME_DATA } from './data.js';
import { AudioController } from './AudioController.js';
import { GlobeController } from './GlobeController.js';
import { UI } from './UI.js';

// Import Styles
import '../styles/base.css';
import '../styles/ui.css';
import '../styles/effects.css';
import '../styles/screens/landing.css';
import '../styles/screens/teacher.css';
import '../styles/screens/player.css';
import '../styles/game.css';
import '../styles/responsive.css';

var roundRobinIndex = 0;
export class Game {
    constructor() {
        this.role = null;
        this.uid = null;
        this.sessionCode = null;
        this.currentScenario = null;
        this.timeLeft = 90;
        this.timer = null;
        this.audio = new AudioController();
        this.players = {}; // For teacher to track local state
        this.syncData = null;
    }

    async init() {
        this.ui = new UI(this);
        this.globe = new GlobeController('globe-container');

        // Initialize Firebase early so auth listener works
        const { FIREBASE_CONFIG } = await import('./firebase-config.js');
        await api.init(FIREBASE_CONFIG);

        // Listen for auth changes for persistence
        api.onAuthStateChanged((user) => this.handleAuthStateChanged(user));
    }

    // --- Role Management ---

    async selectRole(role) {
        this.role = role;

        if (role === 'teacher') {
            const user = api.auth.currentUser;
            // Only allow email/password users to skip login
            if (user && user.providerData.some(p => p.providerId === 'password')) {
                this.ui.showTeacherSetup();
            } else {
                this.ui.showTeacherLogin();
            }
        } else {
            this.ui.showPlayerJoin();
        }
    }

    // --- Teacher Actions ---

    async handleTeacherLogin(email, password) {
        const loginBtn = document.getElementById('login-submit-btn');
        const backBtn = document.getElementById('back-from-login-btn');
        const loading = document.getElementById('login-loading');
        const statusMsg = document.getElementById('login-status-msg');

        try {
            if (loginBtn) loginBtn.disabled = true;
            if (backBtn) backBtn.disabled = true;
            if (loading) loading.classList.remove('hidden');
            if (statusMsg) {
                statusMsg.innerText = "";
                statusMsg.className = "status-msg";
            }

            await api.loginTeacher(email, password);

            if (statusMsg) {
                statusMsg.innerText = "ACESSO CONCEDIDO";
                statusMsg.classList.add('success');
            }

            setTimeout(() => {
                this.ui.showTeacherSetup();
            }, 1000);

        } catch (e) {
            console.error("Login failed:", e);
            if (statusMsg) {
                statusMsg.innerText = "ERRO: " + (e.message.includes('auth/') ? "Credenciais inválidas" : e.message);
                statusMsg.classList.add('error');
            }
            if (loginBtn) loginBtn.disabled = false;
            if (backBtn) backBtn.disabled = false;
        } finally {
            if (loading) loading.classList.add('hidden');
        }
    }

    handleAuthStateChanged(user) {
        console.log("Auth state changed:", user ? user.uid : "None");
        // If we are on the login screen and user just logged in as teacher, transition
        const loginScreen = document.getElementById('teacher-login-screen');
        if (user && loginScreen && !loginScreen.classList.contains('hidden')) {
            if (user.providerData.some(p => p.providerId === 'password')) {
                this.ui.showTeacherSetup();
            }
        }
    }

    async createSession() {
        const createBtn = document.getElementById('create-session-btn');
        const backBtn = document.getElementById('back-to-role-btn');
        const loading = document.getElementById('create-loading');

        try {
            if (createBtn) createBtn.disabled = true;
            if (backBtn) backBtn.disabled = true;
            if (loading) loading.classList.remove('hidden');

            this.sessionCode = await api.createSession();
            this.ui.updateSessionDisplay(this.sessionCode);
            api.onSessionUpdate((data) => this.handleSync(data));
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

            this.sessionCode = await api.reconnectSession(code);
            this.role = 'teacher';
            this.ui.updateSessionDisplay(this.sessionCode);

            api.onSessionUpdate((data) => this.handleSync(data));
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
            // Refresh list
            this.ui.loadTeacherSessions();
        } catch (e) {
            alert(e.message);
        } finally {
            if (loading) loading.classList.add('hidden');
        }
    }

    async handleLogout() {
        if (!confirm("Tem certeza que deseja fazer logoff do Centro de Comando?")) return;
        await api.logout();
        this.role = null;
        this.ui.showRoleSelection();
    }

    async startMission() {
        const playerUids = Object.keys(this.syncData.players || {});
        const assignments = {};

        // Assign unique continents
        const continents = [...GAME_DATA.continents];
        this.shuffleArray(continents);

        // Start with early-game category for everyone
        const possible = GAME_DATA.scenarios.filter(s => s.category === 'early-game');

        playerUids.forEach((uid, index) => {
            const randomScenario = possible[Math.floor(Math.random() * possible.length)];
            assignments[uid] = randomScenario.id;

            // Assign continent (cycling if more than 6 players, though limit is 6)
            const continent = continents[index % continents.length];
            api.sessionRef.update({
                [`players.${uid}.continent`]: continent
            });
        });

        await api.startNextScenario(assignments);

        // Teacher ambiance starts in Round 1
        this.audio.play('ambiance');
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    getNextScenario(round) {
        const scenarios = GAME_DATA.scenarios.filter(s => s.round === (this.syncData?.round || round));
        // Simple sequential or random
        return scenarios[0];
    }

    // --- Player Actions ---

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
            this.uid = uid;
            this.sessionCode = code;

            if (statusEl) {
                statusEl.innerText = "CONECTADO COM SUCESSO!";
                statusEl.classList.add('success');
            }

            // Transition to lobby after a brief delay for success feedback
            setTimeout(() => {
                this.ui.showPlayerLobby();
                api.onSessionUpdate((data) => this.handleSync(data));
            }, 1000);
        } catch (e) {
            alert(e.message);
            if (joinBtn) joinBtn.disabled = false;
            if (backBtn) backBtn.disabled = false;
            if (statusEl) statusEl.innerText = "";
        }
    }

    async leaveMission() {
        if (!confirm("Tem certeza que deseja sair desta sessão?")) return;
        try {
            await api.leaveSession(this.uid);
            this.uid = null;
            this.sessionCode = null;
            this.ui.showRoleSelection();
        } catch (e) {
            alert(e.message);
        }
    }

    async cancelSession() {
        if (confirm("Tem certeza que deseja encerrar a sessão? Todos os jogadores serão desconectados.")) {
            await api.cancelSession();
            // The handleSync listener will detect the deletion and handle the UI transition
            // This gives time for all players to be notified before local cleanup
        }
    }

    async advanceFromResults() {
        if (this.role !== 'teacher') return;

        if (this.syncData.round >= GAME_DATA.config.maxRounds) {
            // Game over - go to final results
            await api.updateSessionStatus('finished');
        } else {
            // Continue to next round
            await this.startNextRound();
        }
    }

    async submitAllocation(allocations) {
        clearInterval(this.timer);
        this.timer = null;
        this.ui.showPlayerWait("Decisão enviada! Analisando impacto...");
        // Save current scenario ID used for scoring later
        const player = this.syncData.players[this.uid];
        await api.sessionRef.update({
            [`players.${this.uid}.lastScenarioId`]: player.currentScenarioId
        });

        this.audio.play('confirm');
        await api.submitAllocation(this.uid, allocations);
    }

    // --- Global Logic ---

    handleSync(data) {
        if (!data) {
            // Session deleted/cancelled
            const wasTeacher = this.role === 'teacher';
            if (this.role === 'player') {
                alert("A sessão foi encerrada pelo professor.");
            }
            this.sessionCode = null;
            this.globe.stopCycling();

            if (wasTeacher) {
                this.ui.showTeacherSetup();
            } else {
                this.ui.showRoleSelection();
            }

            if (api.unsubscribe) api.unsubscribe();
            return;
        }

        this.syncData = data;

        if (this.role === 'player') {
            if (data.status === 'waiting') {
                this.ui.renderPlayerLobby(data);
                return;
            }
            const player = data.players[this.uid];
            if (data.status === 'active') {
                if (player.submitted) {
                    this.ui.showPlayerWait("Aguardando outros líderes...");
                } else if (this.currentScenario?.id !== player.currentScenarioId) {
                    this.startPlayerTurn(player.currentScenarioId);
                }
            } else if (data.status === 'results') {
                this.ui.showRoundResults(data, player);
            } else if (data.status === 'finished') {
                this.ui.renderEndScreen(data);
            }
        } else { // teacher role
            if (data.status === 'waiting') {
                this.ui.showTeacherSetup();
                this.ui.updateSessionDisplay(data.code);
                this.ui.renderTeacherDashboard(data);
                this.timer = null; // Ensure timer is clean
            } else if (data.status === 'active') {
                this.ui.renderTeacherDashboard(data);
                if (!this.timer || this.currentScenario?.id !== data.scenarioId) {
                    this.startRound(data.scenarioId);
                }
                if (this.allPlayersSubmitted(data.players)) {
                    this.endRound();
                }
            } else if (data.status === 'results') {
                this.ui.showTeacherResults(data);
            } else if (data.status === 'finished') {
                this.ui.renderEndScreen(data);
            }
        }
    }

    allPlayersSubmitted(players) {
        const uids = Object.keys(players);
        if (uids.length === 0) return false;
        return uids.every(uid => players[uid].submitted);
    }

    startRound(scenarioId) {
        // Teacher view shows round info
        const roundNumber = this.syncData.round || 1;
        const maxRounds = GAME_DATA.config.maxRounds;

        let scenario = null;
        if (roundNumber === 1 || roundNumber === maxRounds) {
            scenario = GAME_DATA.scenarios.find(s => s.id === scenarioId);
        }

        this.timeLeft = GAME_DATA.config.timerSeconds;
        this.ui.showTeacherGame(scenario, roundNumber);
        this.startTimer();

        // Start cycling through ACTIVE players' continents
        const activePlayers = Object.values(this.syncData.players || {});
        const activeContinents = activePlayers
            .filter(p => p.continent)
            .map(p => p.continent);

        if (activeContinents.length > 0) {
            this.globe.startCycling(activeContinents, (continent) => {
                this.ui.renderStatusCard(continent);
                // Also update news feed with a relevant snippet for that continent occasionally
                if (Math.random() > 0.3) {
                    this.ui.updateNewsFeed(continent);
                }
            }, 8000);
        }

        // Start background news feed (general)
        if (!this.newsInterval) {
            this.newsInterval = setInterval(() => this.ui.updateNewsFeed(), 15000);
        }
    }

    startPlayerTurn(scenarioId) {
        const scenario = GAME_DATA.scenarios.find(s => s.id === scenarioId);
        this.currentScenario = scenario;
        this.timeLeft = GAME_DATA.config.timerSeconds;
        this.ui.showPlayerInteraction(scenario);
        this.startTimer();
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.ui.updateTimer(this.timeLeft);
            if (this.timeLeft <= 0) {
                this.endRound();
            }
        }, 1000);
    }

    async endRound() {
        if (this.isEnding) return;
        this.isEnding = true;

        clearInterval(this.timer);
        this.timer = null;
        this.globe.stopCycling();

        if (this.role === 'teacher') {
            setTimeout(async () => {
                await api.updateSessionStatus('results');
                await this.calculateResults();
                this.isEnding = false;
            }, 5000);
        } else {
            // Player side auto-submit if screen is open
            const interactionScreen = document.getElementById('player-game-screen');
            if (interactionScreen && !interactionScreen.classList.contains('hidden')) {
                const allocations = this.ui.getCurrentAllocations();
                await this.submitAllocation(allocations);
            }
            this.isEnding = false;
        }
    }

    async calculateResults() {
        const players = this.syncData.players;
        const updates = {};

        for (const uid in players) {
            const player = players[uid];
            if (!player.submitted) continue;

            // Fetch the scenario this specific player just faced
            const scenario = GAME_DATA.scenarios.find(s => s.id === player.currentScenarioId);
            if (!scenario) continue;

            const score = this.calculateImpactScore(player.resources, scenario.initiatives);
            updates[`players.${uid}.score`] = (player.score || 0) + score;

            // Adaptive Difficulty: Toggle 'good' or 'bad' for mid-game
            let type = player.difficulty || 'good'; // Default to good path
            if (score <= 60) type = 'bad';
            else if (score >= 80) type = 'good';
            updates[`players.${uid}.difficulty`] = type;

            // Record history
            const historyItem = {
                scenarioId: scenario.id,
                scenarioText: scenario.text,
                resources: player.resources,
                score: score,
                initiatives: scenario.initiatives
            };
            updates[`players.${uid}.history`] = firebase.firestore.FieldValue.arrayUnion(historyItem);

            updates[`players.${uid}.submitted`] = false; // Reset for next turn
            updates[`players.${uid}.resources`] = {};
        }

        await api.sessionRef.update(updates);

        // Set status to 'results' to show round results screen
        await api.updateSessionStatus('results');
    }

    calculateImpactScore(resources, initiatives) {
        let totalDeviation = 0;
        initiatives.forEach(init => {
            const playerVal = resources[init.id] || 0;
            const idealVal = init.ideal;
            totalDeviation += Math.abs(playerVal - idealVal);
        });

        // Max possible deviation is roughly 200
        const accuracy = Math.max(0, 1 - (totalDeviation / 150)); // 150 is a bit more forgiving
        return Math.floor(accuracy * 100);
    }

    async startNextRound() {
        const nextRound = (this.syncData.round || 1) + 1;
        const players = this.syncData.players;
        const assignments = {};
        const maxRounds = GAME_DATA.config.maxRounds;

        const category = this.getCategoryForRound(nextRound, maxRounds);

        for (const uid in players) {
            const player = players[uid];
            let type = player.difficulty || 'good';

            // Branch for Round 5 based on performance (Score after 4 rounds)
            if (category === 'endgame') {
                const totalScore = player.score || 0;
                // Thresholds scaled for up to 5 rounds (max 500 pts)
                if (totalScore >= 350) type = 'utopia';
                else if (totalScore >= 180) type = 'stability';
                else type = 'collapse';
            }

            const possible = GAME_DATA.scenarios.filter(s => s.category === category && s.type === type);
            if (possible.length > 0) {
                const randomScenario = possible[Math.floor(Math.random() * possible.length)];
                assignments[uid] = randomScenario.id;
            } else {
                // Fallback to any scenario in category if type not found
                const fallback = GAME_DATA.scenarios.filter(s => s.category === category);
                assignments[uid] = fallback.length > 0 ? fallback[Math.floor(Math.random() * fallback.length)].id : null;
            }
        }

        await api.startNextScenario(assignments, nextRound);

        // Teacher ambiance starts
        this.audio.play('ambiance');
    }

    getCategoryForRound(round, max) {
        if (round === 1) return 'early-game';
        if (round === max) return 'endgame';

        // Distribution of mid-game rounds
        if (max === 5) {
            // For max=5: R2 is present, R3 and R4 are future.
            return (round === 2) ? 'mid-game-present' : 'mid-game-future';
        }

        // Generic logic for other maxRound values
        const midRounds = max - 2;
        const currentMidIndex = round - 1; // Round 2 is 1st mid round
        if (currentMidIndex <= Math.ceil(midRounds / 2)) return 'mid-game-present';
        return 'mid-game-future';
    }

    async requestRestart() {
        await api.signalRestartReady(this.uid, true);
    }

    async teacherRestart() {
        const playerUids = Object.keys(this.syncData.players || {});
        await api.resetSession(playerUids);
    }
}

// Entry Point
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
