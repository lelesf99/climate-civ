class Game {
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

        // Firebase Config (Assuming user provides this or it's hardcoded for the demo)
        // For now, we'll try to init with an empty config and let it fail gracefully if needed
        // but ideally the user should set this up.
        // I will wait for user to setup, but I can provide the structure.
        console.log("Game initialized. Waiting for role selection.");
    }

    // --- Role Management ---

    async selectRole(role) {
        this.role = role;
        await api.init({}); // Config should be here
        if (role === 'teacher') {
            this.ui.showTeacherSetup();
        } else {
            this.ui.showPlayerJoin();
        }
    }

    // --- Teacher Actions ---

    async createSession() {
        this.sessionCode = await api.createSession();
        console.log(this.sessionCode);
        this.ui.updateSessionDisplay(this.sessionCode);
        api.onSessionUpdate((data) => this.handleSync(data));
    }

    async startMission() {
        const playerUids = Object.keys(this.syncData.players || {});
        const assignments = {};

        // Start with early-game category for everyone
        const possible = GAME_DATA.scenarios.filter(s => s.category === 'early-game');

        playerUids.forEach(uid => {
            const randomScenario = possible[Math.floor(Math.random() * possible.length)];
            assignments[uid] = randomScenario.id;
        });

        await api.startNextScenario(assignments);
    }

    getNextScenario(round) {
        const scenarios = GAME_DATA.scenarios.filter(s => s.round === (this.syncData?.round || round));
        // Simple sequential or random
        return scenarios[0];
    }

    // --- Player Actions ---

    async joinMission(code, name) {
        try {
            const { uid } = await api.joinSession(code, name);
            this.uid = uid;
            this.sessionCode = code;
            this.ui.showPlayerWait("Aguardando o professor iniciar...");
            api.onSessionUpdate((data) => this.handleSync(data));
        } catch (e) {
            alert(e.message);
        }
    }

    async submitAllocation(allocations) {
        this.ui.showPlayerWait("Decisão enviada! Analisando impacto...");
        // Save current scenario ID used for scoring later
        const player = this.syncData.players[this.uid];
        await api.sessionRef.update({
            [`players.${this.uid}.lastScenarioId`]: player.currentScenarioId
        });
        await api.submitAllocation(this.uid, allocations);
    }

    // --- Global Logic ---

    handleSync(data) {
        this.syncData = data;

        if (this.role === 'teacher') {
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
            } else if (data.status === 'finished') {
                this.ui.renderEndScreen(data);
            }
        } else {
            const player = data.players[this.uid];
            if (data.status === 'waiting') {
                this.ui.showPlayerWait("Aguardando o professor iniciar...");
            } else if (data.status === 'active') {
                if (this.currentScenario?.id !== player.currentScenarioId) {
                    this.startPlayerTurn(player.currentScenarioId);
                }
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
        // Teacher view shows round info and a generic status message
        const roundNumber = this.syncData.round || 1;
        const maxRounds = GAME_DATA.config.maxRounds;

        let scenario = null;
        // For early and endgame, show the specific scenario if it's unified (optional improvement)
        if (roundNumber === 1 || roundNumber === maxRounds) {
            scenario = GAME_DATA.scenarios.find(s => s.id === scenarioId);
        }

        this.timeLeft = GAME_DATA.config.timerSeconds;
        this.ui.showTeacherGame(scenario, roundNumber);
        this.startTimer();
    }

    startPlayerTurn(scenarioId) {
        const scenario = GAME_DATA.scenarios.find(s => s.id === scenarioId);
        this.currentScenario = scenario;
        this.ui.showPlayerInteraction(scenario);
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
        clearInterval(this.timer);
        this.timer = null;
        if (this.role === 'teacher') {
            await api.updateSessionStatus('results');
            this.calculateResults();
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

        if (this.syncData.round >= GAME_DATA.config.maxRounds) {
            await api.updateSessionStatus('finished');
        } else {
            setTimeout(() => this.startNextRound(), 5000);
        }
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

        await api.sessionRef.update({ round: nextRound });
        await api.startNextScenario(assignments);
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

class UI {
    constructor(game) {
        this.game = game;
        this.initEventListeners();
    }

    initEventListeners() {
        // Role Selection
        document.getElementById('teacher-role-btn').addEventListener('click', () => this.game.selectRole('teacher'));
        document.getElementById('player-role-btn').addEventListener('click', () => this.game.selectRole('player'));

        // Teacher Setup
        const createBtn = document.getElementById('create-session-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.game.createSession());
        }

        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.game.startMission());
        }

        // Player Join
        const joinBtn = document.getElementById('join-session-btn');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                const code = document.getElementById('join-code-input').value;
                const name = document.getElementById('player-name-input').value;
                this.game.joinMission(code, name);
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

        // Mute
        document.getElementById('mute-btn').addEventListener('click', () => {
            this.game.audio.toggleMute();
        });

        // Restart flow
        const playerReadyBtn = document.getElementById('player-ready-btn');
        if (playerReadyBtn) {
            playerReadyBtn.addEventListener('click', () => this.game.requestRestart());
        }

        const teacherRestartBtn = document.getElementById('teacher-restart-btn');
        if (teacherRestartBtn) {
            teacherRestartBtn.addEventListener('click', () => this.game.teacherRestart());
        }
    }

    showTeacherSetup() {
        this.hideAll();
        document.getElementById('teacher-setup-screen').classList.remove('hidden');
    }

    showPlayerJoin() {
        this.hideAll();
        document.getElementById('player-join-screen').classList.remove('hidden');
    }

    updateSessionDisplay(code) {
        document.getElementById('create-session-btn').classList.add('hidden');
        document.getElementById('session-info').classList.remove('hidden');
        document.getElementById('session-code-display').innerText = code;
    }

    renderTeacherDashboard(data) {
        const players = data.players || {};
        const uids = Object.keys(players);

        // Setup screen player list
        const list = document.getElementById('connected-players-list');
        if (list) {
            list.innerHTML = uids.map(uid => `<li>${players[uid].name}</li>`).join('');
            document.getElementById('player-count').innerText = uids.length;
            document.getElementById('start-game-btn').disabled = uids.length === 0;
        }

        // Game screen player status
        const grid = document.getElementById('player-status-grid');
        if (grid) {
            grid.innerHTML = uids.map(uid => {
                const p = players[uid];
                const isBad = p.difficulty === 'bad';
                return `
                    <div class="player-status-card ${p.submitted ? 'submitted' : ''}">
                        <div class="card-header">
                            <span>${p.name}</span>
                            ${isBad ? '<span class="diff-badge hard">CRÍTICO</span>' : '<span class="diff-badge">ESTÁVEL</span>'}
                        </div>
                        <div class="player-score">${p.score || 0} PTS</div>
                        <div class="status-indicator"></div>
                    </div>
                `;
            }).join('');
        }
    }

    showTeacherGame(scenario, round) {
        this.hideAll();
        document.getElementById('teacher-game-screen').classList.remove('hidden');
        const roundInfo = GAME_DATA.rounds[round - 1];
        document.getElementById('scenario-text').innerHTML = `
            <div style="color: var(--accent-color); font-size: 1.5rem; margin-bottom: 1rem;">ROUND ${round}: ${roundInfo.name}</div>
            <p>${scenario ? scenario.text : "Os líderes estão enfrentando desafios adaptados às suas decisões anteriores. Monitore o progresso no painel abaixo."}</p>
        `;
    }

    showPlayerInteraction(scenario) {
        this.hideAll();
        document.getElementById('player-game-screen').classList.remove('hidden');
        document.getElementById('resource-allocation-container').classList.remove('hidden');
        document.getElementById('wait-message').classList.add('hidden');
        document.getElementById('player-scenario-brief').innerText = scenario.text;

        this.renderSliders(scenario.initiatives);
    }

    renderSliders(initiatives) {
        const container = document.getElementById('sliders-container');
        container.innerHTML = initiatives.map(init => `
            <div class="slider-group">
                <label>
                    <span>${init.name}</span>
                    <span class="value-display">0%</span>
                </label>
                <input type="range" min="0" max="100" value="0" class="resource-slider" data-id="${init.id}">
            </div>
        `).join('');

        // Add slider logic to balance pool
        const sliders = container.querySelectorAll('.resource-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', () => this.balanceSliders(slider, sliders));
        });
    }

    balanceSliders(changedSlider, allSliders) {
        let total = 0;
        allSliders.forEach(s => total += parseInt(s.value));

        if (total > 100) {
            const diff = total - 100;
            // This is a simple balancing: reduce others proportionally
            // In a better implementation, we'd cap the current slider or reduce others more smartly.
            changedSlider.value = parseInt(changedSlider.value) - diff;
        }

        this.updateSliderDisplays(allSliders);
    }

    updateSliderDisplays(sliders) {
        let total = 0;
        sliders.forEach(s => {
            const val = parseInt(s.value);
            total += val;
            s.closest('.slider-group').querySelector('.value-display').innerText = `${val}%`;
        });
        document.getElementById('remaining-resources').innerText = 100 - total;
    }

    getCurrentAllocations() {
        const allocations = {};
        document.querySelectorAll('.resource-slider').forEach(s => {
            allocations[s.dataset.id] = parseInt(s.value);
        });
        return allocations;
    }

    showPlayerWait(message) {
        document.getElementById('resource-allocation-container').classList.add('hidden');
        document.getElementById('wait-message').classList.remove('hidden');
        document.getElementById('wait-message').querySelector('p').innerText = message;
    }

    updateTimer(time) {
        const display = document.getElementById('timer-display');
        const pDisplay = document.getElementById('player-timer-display');
        if (display) display.innerText = `${time}s`;
        if (pDisplay) pDisplay.innerText = `${time}s`;
    }

    renderEndScreen(data) {
        this.hideAll();
        document.getElementById('end-screen').classList.remove('hidden');

        const players = data.players || {};
        if (this.game.role === 'teacher') {
            this.renderTeacherEndView(players);
        } else {
            this.renderPlayerEndView(players[this.game.uid]);
        }
    }

    renderTeacherEndView(players) {
        document.getElementById('teacher-end-view').classList.remove('hidden');
        document.getElementById('player-end-view').classList.add('hidden');

        const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

        // Outcomes Grid
        const grid = document.getElementById('player-outcomes-grid');
        grid.innerHTML = sortedPlayers.map((p, i) => {
            const status = this.getCivilizationStatus(p.score);
            return `
                <div class="outcome-card ${i === 0 ? 'winner' : ''}">
                    <div class="outcome-rank">#${i + 1} ${p.name}</div>
                    <div class="outcome-score">${p.score} PTS</div>
                    <div class="outcome-status" style="color: ${status.color}">${status.label}</div>
                    <p class="outcome-desc">${status.desc}</p>
                </div>
            `;
        }).join('');

        this.updateRestartLobby(players);
    }

    getCivilizationStatus(score) {
        // Max score is 500 (5 rounds * 100)
        if (score >= 400) return { label: "UTOPIA VERDE", color: "#10b981", desc: "Sua gestão alcançou o equilíbrio perfeito entre progresso e natureza." };
        if (score >= 250) return { label: "ESTABILIDADE", color: "#34d399", desc: "A civilização sobreviveu aos desafios, mas com cicatrizes moderadas." };
        if (score >= 150) return { label: "CRISE PERMANENTE", color: "#fbbf24", desc: "Recursos escassos e clima instável definem o novo normal." };
        return { label: "COLAPSO TOTAL", color: "#ef4444", desc: "A falta de planejamento levou ao fim da sociedade como a conhecemos." };
    }

    updateRestartLobby(players) {
        const grid = document.getElementById('player-ready-grid');
        const uids = Object.keys(players);
        grid.innerHTML = uids.map(uid => `
            <div class="ready-card ${players[uid].readyToRestart ? 'ready' : ''}">
                ${players[uid].name}<br>
                <small>${players[uid].readyToRestart ? 'PRONTO' : 'VISUALIZANDO RESULTADOS'}</small>
            </div>
        `).join('');

        const allReady = uids.length > 0 && uids.every(uid => players[uid].readyToRestart);
        document.getElementById('teacher-restart-btn').disabled = !allReady;
    }

    renderPlayerEndView(playerData) {
        if (!playerData) return;
        document.getElementById('player-end-view').classList.remove('hidden');
        document.getElementById('teacher-end-view').classList.add('hidden');

        document.getElementById('player-score-banner').innerHTML = `
            <h1 class="glitch" style="font-size: 3rem">${playerData.score}</h1>
            <p>PONTUAÇÃO TOTAL ACUMULADA</p>
        `;

        const historyList = document.getElementById('scenario-history');
        historyList.innerHTML = (playerData.history || []).map(h => `
            <div class="history-item">
                <h4>${h.scenarioText}</h4>
                <div class="history-stats">
                    <div>Status: ${h.score >= 50 ? 'SUCESSO' : 'REVISÃO NECESSÁRIA'}</div>
                    <div>Precisão: ${h.score}%</div>
                </div>
            </div>
        `).join('');

        if (playerData.readyToRestart) {
            document.getElementById('player-ready-btn').classList.add('hidden');
            document.getElementById('player-ready-msg').classList.remove('hidden');
        } else {
            document.getElementById('player-ready-btn').classList.remove('hidden');
            document.getElementById('player-ready-msg').classList.add('hidden');
        }
    }

    hideAll() {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    }
}

const game = new Game();
game.init();
