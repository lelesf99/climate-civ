var roundRobinIndex = 0;
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
        const createBtn = document.getElementById('create-session-btn');
        const backBtn = document.getElementById('back-to-role-btn');
        const loading = document.getElementById('create-loading');

        try {
            if (createBtn) createBtn.disabled = true;
            if (backBtn) backBtn.disabled = true;
            if (loading) loading.classList.remove('hidden');

            this.sessionCode = await api.createSession();
            console.log(this.sessionCode);
            this.ui.updateSessionDisplay(this.sessionCode);
            api.onSessionUpdate((data) => this.handleSync(data));

            // Hide the reconnect container on success
            const reconnectContainer = document.querySelector('.reconnect-container');
            if (reconnectContainer) reconnectContainer.classList.add('hidden');
        } catch (e) {
            alert(e.message);
            if (createBtn) createBtn.disabled = false;
            if (backBtn) backBtn.disabled = false;
        } finally {
            if (loading) loading.classList.add('hidden');
        }
    }

    async reconnectSession(code) {
        const reconnectBtn = document.getElementById('reconnect-session-btn');
        const loading = document.getElementById('reconnect-loading');

        try {
            if (reconnectBtn) reconnectBtn.disabled = true;
            if (loading) loading.classList.remove('hidden');

            this.sessionCode = await api.reconnectSession(code);
            this.role = 'teacher';
            this.ui.updateSessionDisplay(this.sessionCode);

            // Hide the reconnect container on success
            const reconnectContainer = document.querySelector('.reconnect-container');
            if (reconnectContainer) reconnectContainer.classList.add('hidden');

            api.onSessionUpdate((data) => this.handleSync(data));
        } catch (e) {
            alert(e.message);
            if (reconnectBtn) reconnectBtn.disabled = false;
        } finally {
            if (loading) loading.classList.add('hidden');
        }
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

        // Teacher ambiance starts in Round 1
        this.audio.play('ambiance');
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
            console.log('Iniciando cancelamento da sessão');
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
        console.log('handleSync chamado:', data);
        if (!data) {
            // Session deleted/cancelled
            console.log('Sessão deletada detectada. Role:', this.role);
            if (this.role === 'player') {
                alert("A sessão foi encerrada pelo professor.");
            }
            this.sessionCode = null;
            this.ui.showRoleSelection();
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
        clearInterval(this.timer);
        this.timer = null;
        if (this.role === 'teacher') {
            await api.updateSessionStatus('results');
            this.calculateResults();
        } else {
            // Player side auto-submit if screen is open
            const interactionScreen = document.getElementById('player-game-screen');
            if (interactionScreen && !interactionScreen.classList.contains('hidden')) {
                const allocations = this.ui.getCurrentAllocations();
                await this.submitAllocation(allocations);
            }
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

class UI {
    constructor(game) {
        this.game = game;
        this.lastSoundRound = 0;
        this.initEventListeners();
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

        // Return to selection
        document.querySelectorAll('.return-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showRoleSelection());
        });

        const cancelBtn = document.getElementById('cancel-session-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.game.cancelSession());
        }

        // Teacher Setup
        const createBtn = document.getElementById('create-session-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.game.createSession());
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
                    this.game.joinMission(code, name);
                } else {
                    alert("Insira um código de 4 dígitos e um nome com pelo menos 2 letras.");
                }
            });
        }

        const leaveBtn = document.getElementById('leave-session-btn');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => this.game.leaveMission());
        }

        const reconnectBtn = document.getElementById('reconnect-session-btn');
        if (reconnectBtn) {
            reconnectBtn.addEventListener('click', () => {
                const code = document.getElementById('reconnect-code-input').value;
                if (code.length === 4) {
                    this.game.reconnectSession(code);
                } else {
                    alert("Por favor, insira um código de 4 dígitos.");
                }
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
            playerReadyBtn.addEventListener('click', () => this.game.requestRestart());
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
    }

    showRoleSelection() {
        this.hideAll();
        document.getElementById('role-screen').classList.remove('hidden');
        document.getElementById('role-screen').classList.add('active');

        // Reset inputs
        document.getElementById('join-code-input').value = '';
        document.getElementById('player-name-input').value = '';
        document.getElementById('reconnect-code-input').value = '';
        document.getElementById('session-info').classList.add('hidden');
        document.getElementById('teacher-initial-actions').classList.remove('hidden');
        const backBtn = document.getElementById('back-to-role-btn');
        if (backBtn) backBtn.classList.remove('hidden');

        // Always ensure reconnect container is visible for teachers
        const reconnectContainer = document.querySelector('.reconnect-container');
        if (reconnectContainer) reconnectContainer.classList.remove('hidden');
    }

    showTeacherSetup() {
        this.hideAll();
        document.getElementById('teacher-setup-screen').classList.remove('hidden');
        // Ensure buttons are in initial state if no session active
        if (!this.game.sessionCode) {
            document.getElementById('session-info').classList.add('hidden');
            document.getElementById('teacher-initial-actions').classList.remove('hidden');
        }
    }

    showPlayerJoin() {
        this.hideAll();
        document.getElementById('player-join-screen').classList.remove('hidden');
        const statusEl = document.getElementById('join-status');
        if (statusEl) {
            statusEl.innerText = "";
            statusEl.className = "";
        }
    }

    showPlayerLobby() {
        this.hideAll();
        document.getElementById('player-lobby-screen').classList.remove('hidden');
    }

    updateSessionDisplay(code) {
        document.getElementById('teacher-initial-actions').classList.add('hidden');
        document.getElementById('session-info').classList.remove('hidden');
        document.getElementById('session-code-display').innerText = code;
    }

    renderTeacherDashboard(data) {
        const players = data.players || {};
        const uids = Object.keys(players);

        // Setup screen player grid
        const grid = document.getElementById('teacher-lobby-grid');
        if (grid) {
            grid.innerHTML = uids.map(uid => {
                return `
                    <div class="teacher-player-card">${players[uid].name}</div>
                `;
            }).join('');
            document.getElementById('player-count').innerText = uids.length;
            document.getElementById('start-game-btn').disabled = uids.length === 0;
        }

        // Game screen player status
        const gameGrid = document.getElementById('player-status-grid');
        if (gameGrid) {
            gameGrid.innerHTML = uids.map(uid => {
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

        // Initialize display
        this.updateSliderDisplays(sliders);
    }

    balanceSliders(changedSlider, allSliders) {
        let total = 0;
        allSliders.forEach(s => total += parseInt(s.value));

        if (total > 100) {
            const others = Array.from(allSliders).filter(s => s !== changedSlider);
            const othersTotal = others.reduce((sum, s) => sum + parseInt(s.value), 0);
            const remainingPool = 100 - parseInt(changedSlider.value);

            if (othersTotal > 0) {
                // Calculate proportional values with fractional parts
                const items = others.map(s => {
                    const exact = (parseInt(s.value) / othersTotal) * remainingPool;
                    return {
                        slider: s,
                        floorValue: Math.floor(exact),
                        fraction: exact - Math.floor(exact)
                    };
                });

                // Apply floor values
                items.forEach(item => {
                    item.slider.value = item.floorValue;
                });

                // Distribute remainder to those with largest fractional parts (fair rounding)
                let currentTotal = parseInt(changedSlider.value) + items.reduce((sum, item) => sum + item.floorValue, 0);
                let remainder = 100 - currentTotal;

                if (remainder > 0) {
                    // Sort by highest fraction to lowest
                    items.sort((a, b) => b.fraction - a.fraction);
                    for (let i = 0; i < remainder; i++) {
                        const val = parseInt(items[i].slider.value);
                        items[i].slider.value = val + 1;
                    }
                }
            } else if (others.length > 0) {
                others.forEach(s => s.value = 0);
            }
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
        const waitMsg = document.getElementById('wait-message');
        waitMsg.classList.remove('hidden');
        if (message) {
            waitMsg.querySelector('p').innerText = message;
        }
    }

    renderPlayerLobby(data) {
        const lobbyScreen = document.getElementById('player-lobby-screen');
        if (lobbyScreen.classList.contains('hidden')) {
            this.hideAll();
            lobbyScreen.classList.remove('hidden');
        }

        const players = data.players || {};
        const uids = Object.keys(players);
        const list = document.getElementById('lobby-players-list');
        if (list) {
            list.innerHTML = uids.map(uid => `<li>${players[uid].name}</li>`).join('');
        }
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
        historyList.innerHTML = (playerData.history || []).map((h, i) => {
            const isGood = h.score >= 50;
            return `
                <div class="history-item ${isGood ? 'good' : 'bad'}">
                    <div class="history-index">MISSÃO 0${i + 1}</div>
                    <div class="history-content">
                        <div class="history-scenario">${h.scenarioText}</div>
                        <div class="history-stats">
                            <span class="history-badge ${isGood ? 'success' : 'fail'}">
                                ${isGood ? 'SUCESSO' : 'CRÍTICO'}
                            </span>
                            <span class="history-precision">PRECISÃO: ${h.score}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (playerData.readyToRestart) {
            document.getElementById('player-ready-btn').classList.add('hidden');
            document.getElementById('player-ready-msg').classList.remove('hidden');
        } else {
            document.getElementById('player-ready-btn').classList.remove('hidden');
            document.getElementById('player-ready-msg').classList.add('hidden');
        }
    }



    animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = timestamp - startTimestamp;
            const ratio = Math.min(progress / duration, 1);
            element.innerText = Math.floor(ratio * (end - start) + start);
            if (progress < duration) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    showRoundResults(data, player) {
        this.hideAll();
        document.getElementById('round-results-screen').classList.remove('hidden');

        // Get latest history entry (most recent round)
        const history = player.history || [];
        const lastRound = history[history.length - 1];
        const roundScore = lastRound ? lastRound.score : 0;

        // Display scores
        this.animateValue(document.getElementById('total-score'), player.score - roundScore || 0, player.score, 1000);

        // Generate performance feedback (without emojis)
        const feedbackEl = document.getElementById('performance-feedback');
        let feedbackText = '';
        let feedbackClass = '';

        // Play sound only once per round AND only if history is updated
        const currentRound = data.round || 1;
        const hasHistoryForRound = (player.history || []).length >= currentRound;

        if (this.lastSoundRound !== currentRound && hasHistoryForRound) {
            if (roundScore >= 85) {
                this.game.audio.play('success');
            } else if (roundScore >= 70) {
                this.game.audio.play('success');
            } else {
                this.game.audio.play('fail');
            }
            this.lastSoundRound = currentRound;
        }

        if (roundScore >= 85) {
            feedbackText = 'DECISÕES EXCELENTES!';
            feedbackClass = 'excellent';
        } else if (roundScore >= 70) {
            feedbackText = 'BOAS ESCOLHAS';
            feedbackClass = 'good';
        } else if (roundScore >= 50) {
            feedbackText = 'REVISÃO RECOMENDADA';
            feedbackClass = 'poor';
        } else {
            feedbackText = 'IMPACTO CRÍTICO';
            feedbackClass = 'critical';
        }

        feedbackEl.innerText = feedbackText;
        feedbackEl.className = 'feedback-message ' + feedbackClass;

        // Show initiative breakdown with precision
        const breakdownEl = document.getElementById('initiative-breakdown');
        if (lastRound && lastRound.initiatives) {
            const initiativeHTML = lastRound.initiatives.map(init => {
                const playerValue = lastRound.resources[init.id] || 0;
                const ideal = init.ideal;

                // Calculate deviation
                const deviation = playerValue - ideal;

                // Determine feedback text and rating
                let feedbackText = '';
                let rating = '';

                if (Math.abs(deviation) <= 10) {
                    feedbackText = 'Ideal';
                    rating = 'excellent';
                } else if (deviation > 10) {
                    feedbackText = 'Sobrecarga';
                    rating = deviation > 25 ? 'poor' : 'fair';
                } else {
                    feedbackText = 'Déficit';
                    rating = deviation < -25 ? 'poor' : 'fair';
                }

                return `
                    <div class="initiative-item ${rating}">
                        <span class="initiative-name">${init.name}</span>
                        <span class="initiative-precision ${rating}">${feedbackText}</span>
                    </div>
                `;
            }).join('');

            breakdownEl.innerHTML = initiativeHTML;
        } else {
            breakdownEl.innerHTML = '';
        }
    }

    showTeacherResults(data) {
        this.hideAll();
        document.getElementById('teacher-results-screen').classList.remove('hidden');

        // Display round number
        document.getElementById('teacher-results-round-number').innerText = data.round || 1;

        // Sort players by score (descending)
        const players = data.players || {};
        const playerArray = Object.keys(players).map(uid => ({
            uid,
            ...players[uid]
        })).sort((a, b) => (b.score || 0) - (a.score || 0));

        // Generate player cards with rankings
        const grid = document.getElementById('results-player-grid');
        const rankingBadges = ['1º', '2º', '3º'];

        grid.innerHTML = playerArray.map((player, index) => {
            const history = player.history || [];
            const lastRound = history[history.length - 1];
            const roundScore = lastRound ? lastRound.score : 0;
            const badge = index < 3 ? rankingBadges[index] : `#${index + 1}`;

            return `
                <div class="result-player-card">
                    <div class="ranking-badge">${badge}</div>
                    <div class="result-player-name">${player.name}</div>
                    <div class="result-stats">
                        <div class="result-stat-row">
                            <span class="stat-label">Pontos da Rodada</span>
                            <span class="stat-value">+${roundScore}</span>
                        </div>
                        <div class="result-stat-row">
                            <span class="stat-label">Total Acumulado</span>
                            <span class="stat-value">${player.score || 0}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Update button text based on whether it's the last round
        const nextBtn = document.getElementById('next-round-btn');
        if (data.round >= GAME_DATA.config.maxRounds) {
            nextBtn.innerText = 'VER RESULTADOS FINAIS';
        } else {
            nextBtn.innerText = 'PRÓXIMA RODADA';
        }
    }

    hideAll() {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));

        // Ensure all buttons are re-enabled when changing screens
        document.querySelectorAll('button').forEach(btn => {
            btn.disabled = false;
        });

        // Hide any active loading indicators
        document.querySelectorAll('.loading-container').forEach(loading => {
            loading.classList.add('hidden');
        });
    }
}

const game = new Game();
game.init();
