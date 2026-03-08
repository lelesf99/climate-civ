import { GAME_DATA } from '../data.js';

export class GameUI {
    constructor(game, uiManager) {
        this.game = game;
        this.uiManager = uiManager;
        this.newsInterval = null;
    }

    renderTeacherDashboard(data) {
        const players = data.players || {};
        const uids = Object.keys(players);

        // Setup screen player grid
        const grid = document.getElementById('teacher-lobby-grid');
        if (grid) {
            grid.innerHTML = uids.map(uid => {
                return `
                    <div class="player-status-badge">
                        <span class="player-name">${players[uid].name}</span>
                        <div class="pulse-indicator"></div>
                    </div>
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
                if (!p) return ''; // Safety check for debug/partial data
                const isBad = p.difficulty === 'bad';
                const continentName = p.continent || "SATELLITE LINK";

                return `
                <div class="player-status-badge ${p.submitted ? 'submitted' : ''} ${isBad ? 'critical' : ''}">
                    <span class="player-score">${p.score || 0}</span> ${isBad ? '<span class="status-badge bad">CRÍTICO</span>' : '<span class="status-badge good">ESTÁVEL</span>'}
                    <span class="player-name">${p.continent}</span>
                    <div class="pulse-indicator"></div>    
                </div>
                `;
            }).join('');
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

        if (container.children.length > 20) {
            container.removeChild(container.firstChild);
        }
    }

    renderStatusCard(continent) {
        const container = document.getElementById('status-card-container');
        if (!container) return;

        // Clear previous card
        container.innerHTML = '';

        // Find player for this continent to get status
        const players = this.game.syncData?.players || {};
        const player = Object.values(players).find(p => p.continent === continent);
        if (!player) return;

        const isBad = player.difficulty === 'bad';
        let statusType = isBad ? 'bad' : 'good';
        const templates = GAME_DATA.newsTemplates[statusType] || GAME_DATA.newsTemplates['neutral'];

        // Take up to 3 relevant news items
        const localNews = templates.slice(0, 3).map(t => t.replace('{continent}', continent));

        const card = document.createElement('div');
        card.className = `player-card floating-card ${isBad ? 'critical' : ''}`;

        card.innerHTML = `
            <div class="player-card-header">
                <div class="player-card-id">
                    <span class="player-card-name">${player.name}</span>
                    <span class="player-card-continent">${continent}</span>
                </div>
                <div class="player-card-score">
                    <span class="score-num">${player.score || 0}</span>
                    <span class="score-lbl">PONTOS</span>
                </div>
            </div>
            <div class="player-card-body">
                <div class="card-news-feed" style="margin-top:0; padding-top:0; border-top:none;">
                    <div class="card-news-track">
                        ${localNews.map(news => `<span class="card-news-item">${news}</span>`).join('')}
                        <!-- Duplicate for seamless looping -->
                        ${localNews.map(news => `<span class="card-news-item">${news}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;

        container.appendChild(card);
    }

    showTeacherGame(sessionCode) {
        this.uiManager.hideAll();
        document.getElementById('teacher-game-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('clear-app');
        document.getElementById('teacher-controls').classList.remove('hidden');
        document.getElementById('mission-code-header').classList.remove('hidden');

        let codeHeader = document.getElementById('mission-code-header');
        if (codeHeader) {
            codeHeader.innerHTML = `${sessionCode}`
        }
    }

    showPlayerInteraction(scenario) {
        this.uiManager.hideAll();
        document.getElementById('player-game-screen').classList.remove('hidden');
        document.getElementById('resource-allocation-container').classList.remove('hidden');
        document.getElementById('presidential-btn-container').classList.remove('hidden');
        document.getElementById('wait-message').classList.add('hidden');
        document.getElementById('player-scenario-brief').innerText = scenario.text;

        this.renderSliders(scenario.initiatives);
    }

    renderSliders(initiatives) {
        const container = document.getElementById('sliders-container');
        container.innerHTML = initiatives.map(init => `
            <div class="slider-group">
                <span class="value-display">0%</span>
                <span>${init.name}</span>        
                <input type="range" min="0" max="100" value="0" class="resource-slider" data-id="${init.id}">
            </div>
        `).join('');

        const sliders = container.querySelectorAll('.resource-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', () => this.balanceSliders(slider, sliders));
        });

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
                const items = others.map(s => {
                    const exact = (parseInt(s.value) / othersTotal) * remainingPool;
                    return {
                        slider: s,
                        floorValue: Math.floor(exact),
                        fraction: exact - Math.floor(exact)
                    };
                });

                items.forEach(item => {
                    item.slider.value = item.floorValue;
                });

                let currentTotal = parseInt(changedSlider.value) + items.reduce((sum, item) => sum + item.floorValue, 0);
                const remainder = 100 - currentTotal;

                if (remainder > 0) {
                    items.sort((a, b) => b.fraction - a.fraction);
                    for (let i = 0; i < remainder; i++) {
                        items[i].slider.value = parseInt(items[i].slider.value) + 1;
                    }
                }
            } else if (others.length > 0) {
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
        document.getElementById('presidential-btn-container').classList.add('hidden');
        const waitMsg = document.getElementById('wait-message');
        waitMsg.classList.remove('hidden');

        // Start Terminal Animation
        this.startTerminalAnimation();
    }

    startTerminalAnimation() {
        const terminal = document.getElementById('terminal-logs');
        if (!terminal) return;
        terminal.innerHTML = '';

        const logs = [
            "[OK] Validating resource allocation (Σ == 100)...",
            "[SYSTEM] Serializing player state to JSON data packet...",
            "[LOCAL] Writing decision to localStorage fallback...",
            "[FIRESTORE] Handshaking with session document 'STUD'...",
            "[FIRESTORE] Pushing update to 'players/mock_student_1'...",
            "[NETWORK] Syncing assets: climate-data-v2.bin (1.4MB)...",
            "[OK] Update confirmed by server (ACK 202)...",
            "[SYSTEM] Attaching snapshot listener for session sync...",
            "[UI] Reconciling Virtual DOM snapshots for Round 1...",
            "[MEMORY] Garbage collecting inactive slider components...",
            "[FIRESTORE] Stream active: waiting for remote leader ACK...",
            "[SYSTEM] Calculating regional delta coefficients...",
            "[OK] Resource alocation verified by global consensus...",
            "[NETWORK] Pinging control node: latency 42ms...",
            "[UI] Warming up results breakdown engine...",
            "[SYSTEM] Background task: polling satellite telemetry..."
        ];

        let i = 0;
        const addLine = () => {
            if (i < logs.length) {
                const line = document.createElement('div');
                line.className = 'log-line';
                line.innerText = logs[i];
                terminal.appendChild(line);
                i++;

                // Auto-scroll
                const wrapper = terminal.parentElement;
                wrapper.scrollTop = wrapper.scrollHeight;

                // Varied timing for realism with pow()
                const delay = i % 5 === 0 ? 1200 : Math.pow(Math.random(), 2) * 1000 + 50;
                setTimeout(addLine, delay);
            } else {
                // Final messages after some delay
                setTimeout(() => {
                    const successLine = document.createElement('div');
                    successLine.className = 'log-line success';
                    successLine.innerText = "> DECISÃO ENVIADA COM SUCESSO.";
                    terminal.appendChild(successLine);

                    setTimeout(() => {
                        const readyLine = document.createElement('div');
                        readyLine.className = 'log-line success';
                        readyLine.innerText = "> OUTROS LÍDERES PRONTOS PARA DELIBERAÇÃO.";
                        terminal.appendChild(readyLine);

                        const wrapper = terminal.parentElement;
                        wrapper.scrollTop = wrapper.scrollHeight;
                    }, 2000);
                }, 1000);
            }
        };

        addLine();
    }
}
