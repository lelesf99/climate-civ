import { api } from './api.js';
import { GAME_DATA } from './data.js';

export class UI {
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

        // Session List Actions (Delegation)
        const sessionList = document.getElementById('teacher-sessions-list');
        if (sessionList) {
            sessionList.addEventListener('click', (e) => {
                const reconnectBtn = e.target.closest('.reconnect-btn');
                const deleteBtn = e.target.closest('.retro-btn-danger');

                if (reconnectBtn) {
                    const code = reconnectBtn.dataset.code;
                    this.game.reconnectSession(code);
                }

                if (deleteBtn) {
                    const code = deleteBtn.dataset.code;
                    this.game.handleDeleteSession(code);
                }
            });
        }

        const logoutBtn = document.getElementById('teacher-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
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
    }

    showRoleSelection() {
        this.hideAll();
        document.getElementById('role-screen').classList.remove('hidden');
        document.getElementById('role-screen').classList.add('active');

        // Reset inputs and validation states
        document.querySelectorAll('.retro-input').forEach(input => {
            input.value = '';
            input.classList.remove('valid');
            input.removeAttribute('aria-invalid');
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

        // Always ensure sessions container is visible for teachers
        const sessionsContainer = document.getElementById('teacher-sessions-container');
        if (sessionsContainer) sessionsContainer.classList.remove('hidden');
    }

    showTeacherLogin() {
        this.hideAll();
        document.getElementById('teacher-login-screen').classList.remove('hidden');
    }

    showTeacherSetup() {
        this.hideAll();
        document.getElementById('teacher-setup-screen').classList.remove('hidden');
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
            const date = s.createdAt ? new Date(s.createdAt.toMillis()).toLocaleString('pt-BR') : 'Data desconhecida';
            const playerCount = Object.keys(s.players || {}).length;

            return `
                <div class="session-item">
                    <div class="session-info-cols">
                        <span class="session-id">MISSÃO ${s.id}</span>
                        <span class="session-date">${playerCount} LÍDERES | ${date}</span>
                    </div>
                    <div class="session-actions">
                        <button class="retro-btn small-btn reconnect-btn" data-code="${s.id}"><span class="material-symbols-outlined">wifi_tethering</span> RECONECTAR</button>
                        <button class="retro-btn small-btn retro-btn-danger" data-code="${s.id}"><span class="material-symbols-outlined">delete</span></button>
                    </div>
                </div>
            `;
        }).join('');
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
        document.getElementById('teacher-sessions-container').classList.add('hidden');
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
            const countEl = document.getElementById('player-count');
            const startBtn = document.getElementById('start-game-btn');
            if (countEl) countEl.innerText = uids.length;
            if (startBtn) startBtn.disabled = uids.length === 0;
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

        // Update News Feed if active
        if (data.status === 'active' && !this.newsInterval) {
            this.updateNewsFeed();
        }
    }

    updateNewsFeed(specificContinent = null) {
        const data = this.game.syncData;
        if (!data || !data.players) return;

        const uids = Object.keys(data.players);
        if (uids.length === 0) return;

        let continent = specificContinent;
        let p = null;

        if (continent) {
            p = Object.values(data.players).find(player => player.continent === continent);
        } else {
            const randomUid = uids[Math.floor(Math.random() * uids.length)];
            p = data.players[randomUid];
            continent = p.continent || "Geral";
        }

        // Decide news type
        let type = 'neutral';
        if (p && p.difficulty === 'bad') type = 'bad';
        else if (p && p.difficulty === 'good') type = 'good';

        const templates = GAME_DATA.newsTemplates[type];
        const template = templates[Math.floor(Math.random() * templates.length)];
        const newsText = template.replace('{continent}', continent);

        this.addNewsItem(continent, newsText);
    }

    addNewsItem(continent, text) {
        const container = document.getElementById('news-ticker-track');
        if (!container) return;

        const item = document.createElement('div');
        item.className = 'news-item';
        item.innerHTML = `
            <div class="news-dot"></div>
            <span class="news-continent">[${continent}]</span>
            <span class="news-text">${text}</span>
        `;

        container.appendChild(item);

        // In a ticker, we keep a longer history of items for the loop
        if (container.children.length > 20) {
            container.removeChild(container.firstChild);
        }
    }

    showTeacherGame(scenario, round) {
        this.hideAll();
        document.getElementById('teacher-game-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('clear-app');
        document.getElementById('teacher-controls').classList.remove('hidden'); // Show logoff button for teacher game
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
                const remainder = 100 - currentTotal;

                if (remainder > 0) {
                    items.sort((a, b) => b.fraction - a.fraction);
                    for (let i = 0; i < remainder; i++) {
                        items[i].slider.value = parseInt(items[i].slider.value) + 1;
                    }
                }
            } else if (others.length > 0) {
                // If others were all zero, distribute to the first available other
                others[0].value = 100 - parseInt(changedSlider.value);
            }
        }

        this.updateSliderDisplays(allSliders);
    }

    updateSliderDisplays(sliders) {
        let totalAllocated = 0;
        sliders.forEach(slider => {
            const val = parseInt(slider.value);
            totalAllocated += val;
            const display = slider.parentElement.querySelector('.value-display');
            if (display) display.innerText = `${val}%`;
        });

        const poolDisplay = document.getElementById('remaining-resources');
        if (poolDisplay) poolDisplay.innerText = 100 - totalAllocated;
    }

    getCurrentAllocations() {
        const allocations = {};
        document.querySelectorAll('.resource-slider').forEach(slider => {
            allocations[slider.dataset.id] = parseInt(slider.value);
        });
        return allocations;
    }

    showPlayerWait(message) {
        document.getElementById('resource-allocation-container').classList.add('hidden');
        const waitMsg = document.getElementById('wait-message');
        waitMsg.classList.remove('hidden');
        waitMsg.querySelector('p').innerText = message;
    }

    showRoundResults(sessionData, player) {
        this.hideAll();
        document.getElementById('round-results-screen').classList.remove('hidden');
        document.getElementById('results-round-number').innerText = sessionData.round;
        document.getElementById('total-score').innerText = player.score || 0;

        const feedback = document.getElementById('performance-feedback');
        const lastHistory = player.history ? player.history[player.history.length - 1] : null;

        if (lastHistory) {
            let rating = "SATISFATÓRIO";
            let cls = "neutral";
            if (lastHistory.score >= 80) { rating = "EXCELENTE"; cls = "success"; }
            else if (lastHistory.score <= 40) { rating = "CRÍTICO"; cls = "error"; }

            feedback.innerHTML = `
                <div class="rating-badge ${cls}">${rating}</div>
                <p>O impacto das suas decisões gerou uma pontuação de <strong>${lastHistory.score}</strong> nesta rodada.</p>
            `;

            // Play sound based on result if it's a new round
            if (this.lastSoundRound !== sessionData.round) {
                if (lastHistory.score >= 70) this.game.audio.play('success');
                else if (lastHistory.score <= 40) this.game.audio.play('fail');
                this.lastSoundRound = sessionData.round;
            }
        }
    }

    showTeacherResults(data) {
        this.hideAll();
        document.getElementById('teacher-results-screen').classList.remove('hidden');
        document.getElementById('teacher-results-round-number').innerText = data.round;

        const grid = document.getElementById('results-player-grid');
        const players = data.players || {};
        grid.innerHTML = Object.keys(players).map(uid => {
            const p = players[uid];
            const last = p.history ? p.history[p.history.length - 1] : null;
            return `
                <div class="result-card">
                    <h3>${p.name}</h3>
                    <div class="score-line">RODADA: ${last ? last.score : 0}</div>
                    <div class="score-line total">TOTAL: ${p.score || 0}</div>
                </div>
            `;
        }).join('');
    }

    renderEndScreen(data) {
        this.hideAll();
        document.getElementById('end-screen').classList.remove('hidden');
        document.getElementById('app').classList.remove('clear-app');

        if (this.game.role === 'teacher') {
            document.getElementById('teacher-end-view').classList.remove('hidden');
            const grid = document.getElementById('player-outcomes-grid');
            grid.innerHTML = Object.values(data.players).map(p => {
                let status = "ESTÁVEL";
                if (p.difficulty === 'utopia') status = "UTOPIA VERDE";
                else if (p.difficulty === 'collapse') status = "COLAPSO TOTAL";
                return `
                    <div class="outcome-card ${p.difficulty}">
                        <strong>${p.name}</strong>
                        <span>FINAL: ${status}</span>
                        <div class="final-score">${p.score} PTS</div>
                    </div>
                `;
            }).join('');

            // Restart Lobby logic
            const readyGrid = document.getElementById('player-ready-grid');
            const readyUids = Object.keys(data.players).filter(uid => data.players[uid].readyToRestart);
            readyGrid.innerHTML = Object.values(data.players).map(p => `
                <div class="ready-indicator ${p.readyToRestart ? 'ready' : ''}">${p.name}</div>
            `).join('');

            const restartBtn = document.getElementById('teacher-restart-btn');
            restartBtn.disabled = readyUids.length === 0;

        } else {
            document.getElementById('player-end-view').classList.remove('hidden');
            const p = data.players[this.game.uid];
            let title = "O LEGADO DE " + p.name;
            let theme = p.difficulty; // utopia, stability, collapse

            document.getElementById('player-score-banner').innerHTML = `
                <h2 class="outcome-title ${theme}">${title}</h2>
                <div class="final-score-large">${p.score} <small>PONTOS TOTAIS</small></div>
            `;

            const historyList = document.getElementById('scenario-history');
            historyList.innerHTML = p.history.map((h, i) => `
                <div class="history-item">
                    <span class="history-round">RODADA ${i + 1}</span>
                    <p>${h.scenarioText}</p>
                    <div class="history-impact">IMPACTO: ${h.score}/100</div>
                </div>
            `).join('');

            const readyBtn = document.getElementById('player-ready-btn');
            const readyMsg = document.getElementById('player-ready-msg');
            if (p.readyToRestart) {
                readyBtn.classList.add('hidden');
                readyMsg.classList.remove('hidden');
            } else {
                readyBtn.classList.remove('hidden');
                readyMsg.classList.add('hidden');
            }
        }
    }

    updateTimer(seconds) {
        const timeStr = `${seconds}s`;
        const t1 = document.getElementById('timer-display');
        const t2 = document.getElementById('player-timer-display');
        if (t1) t1.innerText = timeStr;
        if (t2) t2.innerText = timeStr;

        if (seconds <= 10) {
            if (t1) t1.classList.add('critical');
            if (t2) t2.classList.add('critical');
            // Play alarm in last 10 seconds if not already playing
            if (seconds === 10) this.game.audio.play('alarm');
        } else {
            if (t1) t1.classList.remove('critical');
            if (t2) t2.classList.remove('critical');
            this.game.audio.pause('alarm');
        }
    }

    hideAll() {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });
        // Remove clear class from app unless specifically needed
        document.getElementById('app').classList.remove('clear-app');
    }
}
