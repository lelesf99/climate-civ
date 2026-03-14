import { store, GamePhase, Role } from './store/gameState.js';
import { api } from './services/api.js';
import { GAME_DATA } from './data.js';
import { AudioController } from './controllers/AudioController.js';
import { GlobeController } from './controllers/GlobeController.js';
import { UI } from './views/UI.js';
import { ScoringEngine } from './controllers/ScoringEngine.js';
import { SessionManager } from './controllers/SessionManager.js';
import firebase from 'firebase/compat/app';

var roundRobinIndex = 0;
const DEBUG_TEACHER_DASHBOARD = false;
const DEBUG_STUDENT_ALLOCATION = false;

export class Game {
    constructor() {
        this.uid = null;
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

        const { FIREBASE_CONFIG } = await import('./services/firebase-config.js');

        try {
            await api.init(FIREBASE_CONFIG);
            api.onAuthStateChanged((user) => this.handleAuthStateChanged(user));

            // Reactively handle sync from store
            store.sessionData$.subscribe(data => {
                if (data !== null) {
                    this.handleSync(data);
                } else if (store.code) {
                    // Session was deleted or dropped while we had a code
                    this.handleSync(null);
                }
            });
        } catch (error) {
            console.error(error.message);
            alert("Erro fatal de inicialização: " + error.message);
            return;
        }

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

    // --- Role & Auth (Keep in core Game) ---
    async selectRole(role) {
        if (role === 'teacher') {
            const user = api.auth.currentUser;
            if (user && user.providerData.some(p => p.providerId === 'password')) {
                store.setRole(Role.TEACHER);
                store.setPhase(GamePhase.TEACHER_SETUP);
            } else {
                store.setPhase(GamePhase.LOGIN);
                this.ui.showTeacherLogin(); // Keep this for now for the specialized screen
            }
        } else {
            const user = api.auth.currentUser;
            const code = sessionStorage.getItem('climateCivSessionCode') || localStorage.getItem('climateCivSessionCode');
            
            if (user && (!user.providerData || !user.providerData.some(p => p.providerId === 'password')) && code && !store.code) {
                this.sessionManager.reconnectPlayer(code, user.uid);
            } else {
                store.setPhase(GamePhase.PLAYER_JOIN);
            }
        }
    }

    async handleTeacherLogin(email, password) {
        try {
            store.setLoading(true);
            await api.loginTeacher(email, password);
            setTimeout(() => {
                store.setRole(Role.TEACHER);
                store.setPhase(GamePhase.TEACHER_SETUP);
            }, 1000);
        } catch (e) {
            store.emitError(e.message.includes('auth/') ? "Credenciais inválidas" : e.message);
        } finally {
            store.setLoading(false);
        }
    }

    handleAuthStateChanged(user) {
        const loginScreen = document.getElementById('teacher-login-screen');
        if (user) {
            this.uid = user.uid; // Critical: Store UID for sync lookups
            if (user.providerData.some(p => p.providerId === 'password')) {
                console.log("Teacher authenticated:", user.uid);
                if (loginScreen && !loginScreen.classList.contains('hidden')) {
                    store.setRole(Role.TEACHER);
                    store.setPhase(GamePhase.TEACHER_SETUP);
                }
            } else {
                console.log("Player authenticated anonymously:", user.uid);
                // We no longer auto-reconnect here on page load. 
                // Reconnection relies on the user explicitly starting as "Aluno".
            }
        } else {
            console.log("User signed out");
            this.stopIntervals();
            api.stopSessionSync();
            store.reset();
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
            api.sessionRef.update({ [`players/${uid}/continent`]: continent });
        });

        await api.startNextScenario(assignments);
        this.audio.play('ambiance');
    }

    async advanceFromResults() {
        if (store.role !== Role.TEACHER) return;
        if (this.syncData.round >= GAME_DATA.config.maxRounds) {
            await api.archiveSession(this.syncData);
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
            [`players/${this.uid}/lastScenarioId`]: player.currentScenarioId
        });

        this.audio.play('confirm');
        await api.submitAllocation(this.uid, allocations, this.timeLeft);
    }

    handleSync(data) {
        if (!data) {
            const wasTeacher = store.role === Role.TEACHER;
            if (store.role === Role.PLAYER) alert("A sessão foi encerrada pelo professor.");
            this.stopIntervals();
            this.globe.stopCycling();

            if (wasTeacher) store.setPhase(GamePhase.TEACHER_SETUP);
            else store.setPhase(GamePhase.PLAYER_JOIN);

            if (api.unsubscribe) api.unsubscribe();
            return;
        }

        this.syncData = data;

        if (store.role === Role.PLAYER) {
            const player = data.players ? data.players[this.uid] : null;
            if (!player) return; // Prevent crash if sync arrives before player node fully hydrates

            if (player.isWaiting) {
                this.ui.renderPlayerLobby(data);
                return;
            }

            if (data.status === 'waiting') {
                this.ui.renderPlayerLobby(data);
                return;
            }
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
                const activeCount = Object.values(data.players || {}).filter(p => this.isPlayerActive(p)).length;
                if (activeCount === 0 && Object.keys(data.players || {}).length > 0) {
                    // Everyone left mid-game! Finish it.
                    api.archiveSession(data);
                    return;
                }

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

    isPlayerActive(player) {
        if (!player) return false;
        if (player.isActive === false || player.isWaiting === true) return false;
        if (player.connections === undefined) return true; // Retro-compatibility for mock/debug players
        return Object.keys(player.connections).length > 0;
    }

    allPlayersSubmitted(players) {
        const activeUids = Object.keys(players).filter(uid => this.isPlayerActive(players[uid]));
        if (activeUids.length === 0) return false;
        return activeUids.every(uid => players[uid].submitted);
    }

    startRound(scenarioId) {
        this.timeLeft = GAME_DATA.config.timerSeconds;
        this.ui.showTeacherGame(store.code);

        this.stopIntervals(); // Clear any existing before starting new
        this.startTimer();

        const activePlayers = Object.values(this.syncData.players || {}).filter(p => this.isPlayerActive(p));
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

        if (store.role === Role.TEACHER) {
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

            // Skip inactive or waiting players
            if (!this.isPlayerActive(player)) continue;

            // If they already have a history item for this round, skip to avoid double counting
            if (player.history && player.history.length >= this.syncData.round) continue;
            if (!player.submitted && !this.timeLeft <= 0) continue; // Only skip if not timeout

            const scenarioId = player.currentScenarioId;
            const scenario = GAME_DATA.scenarios.find(s => s.id === scenarioId);
            if (!scenario) continue;

            const score = this.scorer.calculateImpactScore(
                player.resources || {}, 
                scenario.initiatives,
                player.timeLeft || 0
            );
            updates[`players/${uid}/score`] = (player.score || 0) + score;

            let type = player.difficulty || 'good';
            if (score <= 60) type = 'bad';
            else if (score >= 80) type = 'good';
            updates[`players/${uid}/difficulty`] = type;

            const historyItem = {
                scenarioId: scenario.id,
                scenarioText: scenario.text,
                resources: player.resources || {},
                score: score,
                initiatives: scenario.initiatives
            };
            
            // RTDB doesn't have arrayUnion out of the box. 
            // We fetch the latest history via syncData and append it
            const currentHistory = player.history || [];
            updates[`players/${uid}/history`] = [...currentHistory, historyItem];

            updates[`players/${uid}/submitted`] = false;
            updates[`players/${uid}/resources`] = {};
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
            if (!this.isPlayerActive(player)) continue;

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

        await api.startNextScenario(assignments, nextRound, players);
        this.audio.play('ambiance');
    }

    async toggleRestartReady() {
        const isReady = this.syncData?.players?.[this.uid]?.readyToRestart || false;
        await api.signalRestartReady(this.uid, !isReady);
    }
    async teacherRestart() {
        const playerUids = Object.keys(this.syncData.players || {});
        await api.resetSession(playerUids, this.syncData.players || {});
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
