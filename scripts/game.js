import { api } from './api.js';
import { GAME_DATA } from './data.js';
import { AudioController } from './AudioController.js';
import { GlobeController } from './GlobeController.js';
import { UI } from './UI.js';
import { ScoringEngine } from './Game_modules/ScoringEngine.js';
import { SessionManager } from './Game_modules/SessionManager.js';
import firebase from 'firebase/compat/app';

var roundRobinIndex = 0;
const DEBUG_TEACHER_DASHBOARD = false;
const DEBUG_STUDENT_ALLOCATION = false;

export class Game {
    constructor() {
        this.role = null;
        this.uid = null;
        this.sessionCode = null;
        this.currentScenario = null;
        this.timeLeft = 90;
        this.timer = null;
        this.audio = new AudioController();
        this.players = {};
        this.syncData = null;

        // Initialize Managers
        this.scorer = new ScoringEngine(this);
        this.sessionManager = new SessionManager(this);
    }

    async init() {
        this.ui = new UI(this);
        this.globe = new GlobeController('globe-container');

        const { FIREBASE_CONFIG } = await import('./firebase-config.js');
        await api.init(FIREBASE_CONFIG);

        api.onAuthStateChanged((user) => this.handleAuthStateChanged(user));

        if (DEBUG_TEACHER_DASHBOARD) {
            console.warn("DEBUG MODE: Starting Teacher Dashboard View");
            setTimeout(() => this.startDebugTeacherView(), 2500);
            return;
        }

        if (DEBUG_STUDENT_ALLOCATION) {
            console.warn("DEBUG MODE: Starting Student Allocation View");
            setTimeout(() => this.startDebugStudentView(), 2500);
            return;
        }

        setTimeout(() => {
            const globeContainer = document.getElementById('globe-container');
            const buttons = document.getElementById('role-buttons');
        }, 2000);
    }

    // --- Delegation to SessionManager ---
    async createSession() { await this.sessionManager.createSession(); }
    async reconnectSession(code) { await this.sessionManager.reconnectSession(code); }
    async handleDeleteSession(code) { await this.sessionManager.handleDeleteSession(code); }
    async joinMission(code, name) { await this.sessionManager.joinMission(code, name); }
    async leaveMission() { await this.sessionManager.leaveMission(); }
    async cancelSession() { await this.sessionManager.cancelSession(); }

    // --- Role & Auth (Keep in core Game) ---
    async selectRole(role) {
        this.role = role;
        if (role === 'teacher') {
            const user = api.auth.currentUser;
            if (user && user.providerData.some(p => p.providerId === 'password')) {
                this.ui.showTeacherSetup();
            } else {
                this.ui.showTeacherLogin();
            }
        } else {
            this.ui.showPlayerJoin();
        }
    }

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
            setTimeout(() => this.ui.showTeacherSetup(), 1000);
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
        const loginScreen = document.getElementById('teacher-login-screen');
        if (user) {
            console.log("Teacher authenticated:", user.uid);
            if (user.providerData.some(p => p.providerId === 'password')) {
                if (loginScreen && !loginScreen.classList.contains('hidden')) {
                    this.ui.showTeacherSetup();
                }
            }
        } else {
            console.log("User signed out");
            this.stopIntervals();
            api.stopSessionSync();
            this.role = null;
            this.sessionCode = null;
            if (this.ui) this.ui.showRoleSelection();
        }
    }

    async handleLogout() {
        this.stopIntervals();
        await api.logout();
    }

    // --- Game Lifecycle ---

    async startMission() {
        const playerUids = Object.keys(this.syncData.players || {});
        const assignments = {};
        const continents = [...GAME_DATA.continents];
        this.shuffleArray(continents);

        const possible = GAME_DATA.scenarios.filter(s => s.category === 'early-game');

        playerUids.forEach((uid, index) => {
            const randomScenario = possible[Math.floor(Math.random() * possible.length)];
            assignments[uid] = randomScenario.id;
            const continent = continents[index % continents.length];
            api.sessionRef.update({ [`players.${uid}.continent`]: continent });
        });

        await api.startNextScenario(assignments);
        this.audio.play('ambiance');
    }

    async advanceFromResults() {
        if (this.role !== 'teacher') return;
        if (this.syncData.round >= GAME_DATA.config.maxRounds) {
            await api.updateSessionStatus('finished');
        } else {
            await this.startNextRound();
        }
    }

    async submitAllocation(allocations) {
        clearInterval(this.timer);
        this.timer = null;
        this.ui.showPlayerWait("Decisão enviada! Analisando impacto...");

        const player = this.syncData.players[this.uid];
        await api.sessionRef.update({
            [`players.${this.uid}.lastScenarioId`]: player.currentScenarioId
        });

        this.audio.play('confirm');
        await api.submitAllocation(this.uid, allocations);
    }

    handleSync(data) {
        if (!data) {
            const wasTeacher = this.role === 'teacher';
            if (this.role === 'player') alert("A sessão foi encerrada pelo professor.");
            this.stopIntervals();
            this.globe.stopCycling();

            if (wasTeacher) this.ui.showTeacherSetup();
            else this.ui.showPlayerJoin();

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
                if (player.submitted) this.ui.showPlayerWait("Aguardando outros líderes...");
                else if (this.currentScenario?.id !== player.currentScenarioId) this.startPlayerTurn(player.currentScenarioId);
            } else if (data.status === 'results') this.ui.showRoundResults(data, player);
            else if (data.status === 'finished') this.ui.renderEndScreen(data);
        } else {
            if (data.status === 'waiting') {
                this.ui.showTeacherSetup();
                this.ui.updateSessionDisplay(data.code);
                this.ui.renderTeacherDashboard(data);
                this.timer = null;
            } else if (data.status === 'active') {
                this.ui.renderTeacherDashboard(data);
                // Start round if not already started for this specific round number
                if (!this.timer || this.lastSyncedRound !== data.round) {
                    this.lastSyncedRound = data.round;
                    this.startRound(data.scenarioId);
                }
                if (this.allPlayersSubmitted(data.players)) this.endRound();
            } else if (data.status === 'results') this.ui.showTeacherResults(data);
            else if (data.status === 'finished') this.ui.renderEndScreen(data);
        }
    }

    allPlayersSubmitted(players) {
        const uids = Object.keys(players);
        if (uids.length === 0) return false;
        return uids.every(uid => players[uid].submitted);
    }

    startRound(scenarioId) {
        this.timeLeft = GAME_DATA.config.timerSeconds;
        this.ui.showTeacherGame(this.sessionCode);

        this.stopIntervals(); // Clear any existing before starting new
        this.startTimer();

        const activePlayers = Object.values(this.syncData.players || {});
        const activeContinents = activePlayers.filter(p => p.continent).map(p => p.continent);

        if (activeContinents.length > 0) {
            this.globe.startCycling(activeContinents, (continent) => {
                this.ui.renderStatusCard(continent);
                if (Math.random() > 0.3) this.ui.updateNewsFeed(continent);
            }, 8000);
        }

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
            if (this.ui) this.ui.updateTimer(this.timeLeft);
            if (this.timeLeft <= 0) this.endRound();
        }, 1000);
    }

    stopIntervals() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (this.newsInterval) {
            clearInterval(this.newsInterval);
            this.newsInterval = null;
        }
    }

    async endRound() {
        if (this.isEnding) return;
        this.isEnding = true;

        this.stopIntervals();
        this.globe.stopCycling();

        if (this.role === 'teacher') {
            await api.updateSessionStatus('results');
            await this.calculateResults();
            this.isEnding = false;
        } else {
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
        let anyCalculated = false;

        for (const uid in players) {
            const player = players[uid];
            // If they already have a history item for this round, skip to avoid double counting
            if (player.history && player.history.length >= this.syncData.round) continue;
            if (!player.submitted && !this.timeLeft <= 0) continue; // Only skip if not timeout

            const scenarioId = player.currentScenarioId;
            const scenario = GAME_DATA.scenarios.find(s => s.id === scenarioId);
            if (!scenario) continue;

            const score = this.scorer.calculateImpactScore(player.resources || {}, scenario.initiatives);
            updates[`players.${uid}.score`] = (player.score || 0) + score;

            let type = player.difficulty || 'good';
            if (score <= 60) type = 'bad';
            else if (score >= 80) type = 'good';
            updates[`players.${uid}.difficulty`] = type;

            const historyItem = {
                scenarioId: scenario.id,
                scenarioText: scenario.text,
                resources: player.resources || {},
                score: score,
                initiatives: scenario.initiatives
            };
            updates[`players.${uid}.history`] = firebase.firestore.FieldValue.arrayUnion(historyItem);
            updates[`players.${uid}.submitted`] = false;
            updates[`players.${uid}.resources`] = {};
            anyCalculated = true;
        }

        if (anyCalculated) {
            await api.sessionRef.update(updates);
        }
        // Finalize status after data is pushed
        await api.updateSessionStatus('results');
    }

    async startNextRound() {
        const nextRound = (this.syncData.round || 1) + 1;
        const players = this.syncData.players;
        const assignments = {};
        const maxRounds = GAME_DATA.config.maxRounds;

        const category = this.scorer.getCategoryForRound(nextRound, maxRounds);

        for (const uid in players) {
            const player = players[uid];
            let type = player.difficulty || 'good';

            const branchType = this.scorer.determineDifficultyBranch(player.score || 0, category);
            if (branchType) type = branchType;

            const possible = GAME_DATA.scenarios.filter(s => s.category === category && s.type === type);
            if (possible.length > 0) {
                const randomScenario = possible[Math.floor(Math.random() * possible.length)];
                assignments[uid] = randomScenario.id;
            } else {
                const fallback = GAME_DATA.scenarios.filter(s => s.category === category);
                assignments[uid] = fallback.length > 0 ? fallback[Math.floor(Math.random() * fallback.length)].id : null;
            }
        }

        await api.startNextScenario(assignments, nextRound);
        this.audio.play('ambiance');
    }

    async toggleRestartReady() {
        const isReady = this.syncData?.players?.[this.uid]?.readyToRestart || false;
        await api.signalRestartReady(this.uid, !isReady);
    }
    async teacherRestart() {
        const playerUids = Object.keys(this.syncData.players || {});
        await api.resetSession(playerUids);
    }

    startDebugTeacherView() {
        this.role = 'teacher';
        this.ui.hideAll();

        // Mock Session Data
        this.syncData = {
            status: 'active',
            round: 1,
            code: 'DBUG',
            players: {}
        };

        const continents = GAME_DATA.continents;
        continents.forEach((continent, index) => {
            const uid = `mock_p${index + 1}`;
            this.syncData.players[uid] = {
                name: `Líder ${continent}`,
                continent: continent,
                score: Math.floor(Math.random() * 500),
                difficulty: Math.random() > 0.5 ? 'good' : 'bad',
                submitted: Math.random() > 0.3
            };
        });

        // Show Teacher Game UI
        this.ui.showTeacherGame(null, 1);
        this.ui.renderTeacherDashboard(this.syncData);

        // Static Globe Focus
        const initialContinent = "AMERICA DO SUL";
        this.globe.focusContinent(initialContinent);
        this.ui.renderStatusCard(initialContinent);

        // Start News Feed and Timer
        this.ui.updateNewsFeed(); // Show first news item immediately
        this.newsInterval = setInterval(() => this.ui.updateNewsFeed(), 15000);
        this.timeLeft = 90;
        this.startTimer();
    }

    startDebugStudentView() {
        this.role = 'player';
        this.uid = 'mock_student_1';
        this.ui.hideAll();

        // Mock Session Data
        this.syncData = {
            status: 'active',
            round: 1,
            code: 'STUD',
            players: {
                [this.uid]: {
                    name: 'Estudante Alpha',
                    continent: 'AMERICA DO SUL',
                    score: 150,
                    difficulty: 'good',
                    submitted: false,
                    currentScenarioId: 'early-transport-1'
                }
            }
        };

        const scenario = GAME_DATA.scenarios.find(s => s.id === 'early-transport-1') || GAME_DATA.scenarios[0];
        this.currentScenario = scenario;

        // Show Player Interaction UI
        this.ui.showPlayerInteraction(scenario);
        this.ui.updateTimer(this.timeLeft);
        this.startTimer();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// Entry Point
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
