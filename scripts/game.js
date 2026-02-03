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
        this.ui.updateSessionDisplay(this.sessionCode);
        api.onSessionUpdate((data) => this.handleSync(data));
    }

    async startMission() {
        const scenario = this.getNextScenario(1); // Start with Round 1
        await api.startNextScenario(scenario.id);
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
        await api.submitAllocation(this.uid, allocations);
    }

    // --- Global Logic ---

    handleSync(data) {
        this.syncData = data;

        if (this.role === 'teacher') {
            this.ui.renderTeacherDashboard(data);
            if (data.status === 'active' && !this.timer) {
                this.startRound(data.scenarioId);
            }
            if (this.allPlayersSubmitted(data.players) && data.status === 'active') {
                this.endRound();
            }
        } else {
            if (data.status === 'active' && this.currentScenario?.id !== data.scenarioId) {
                this.startPlayerTurn(data.scenarioId);
            }
            if (data.status === 'finished') {
                this.ui.showEndScreen(data.players);
            }
        }
    }

    allPlayersSubmitted(players) {
        const uids = Object.keys(players);
        if (uids.length === 0) return false;
        return uids.every(uid => players[uid].submitted);
    }

    startRound(scenarioId) {
        const scenario = GAME_DATA.scenarios.find(s => s.id === scenarioId);
        this.currentScenario = scenario;
        this.timeLeft = GAME_DATA.config.timerSeconds;
        this.ui.showTeacherGame(scenario);
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
        const scenario = this.currentScenario;
        const updates = {};

        for (const uid in players) {
            const player = players[uid];
            if (!player.submitted) continue;

            const score = this.calculateImpactScore(player.resources, scenario.initiatives);
            updates[`players.${uid}.score`] = (player.score || 0) + score;
            updates[`players.${uid}.submitted`] = false; // Reset for next turn
        }

        await api.sessionRef.update(updates);

        // Check if game ends
        if (this.syncData.round >= GAME_DATA.config.maxRounds) {
            await api.updateSessionStatus('finished');
        } else {
            // Trigger next round after a delay?
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
        const nextRound = this.syncData.round + 1;
        const scenarios = GAME_DATA.scenarios.filter(s => s.round === nextRound);
        if (scenarios.length > 0) {
            await api.sessionRef.update({ round: nextRound });
            await api.startNextScenario(scenarios[0].id);
        } else {
            await api.updateSessionStatus('finished');
        }
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
            grid.innerHTML = uids.map(uid => `
                <div class="player-status-card ${players[uid].submitted ? 'submitted' : ''}">
                    <span>${players[uid].name}</span>
                    <div class="status-indicator"></div>
                </div>
            `).join('');
        }
    }

    showTeacherGame(scenario) {
        this.hideAll();
        document.getElementById('teacher-game-screen').classList.remove('hidden');
        document.getElementById('scenario-text').innerText = scenario.text;
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

    showEndScreen(players) {
        this.hideAll();
        const screen = document.getElementById('end-screen');
        screen.classList.remove('hidden');

        const resultsDiv = document.getElementById('final-results');
        const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

        resultsDiv.innerHTML = sortedPlayers.map((p, i) => `
            <div class="result-card" style="border-left: 5px solid ${i === 0 ? 'var(--accent-color)' : '#334155'}">
                <h3>${i + 1}. ${p.name}</h3>
                <p>Pontuação Final: <span class="score-highlight">${p.score}</span></p>
                <div class="mini-bar-bg" style="width:100%; height:10px; background:#1e293b; margin-top:5px;">
                    <div style="width:${Math.min(100, p.score / 10)}%; height:100%; background:var(--accent-color)"></div>
                </div>
            </div>
        `).join('');
    }

    hideAll() {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    }
}

const game = new Game();
game.init();
