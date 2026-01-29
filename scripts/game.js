class Game {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.currentPlayerIndex = 0;
        this.questionsAnsweredInRound = 0;
        this.questions = [];
        this.maxDetail = GAME_DATA.config.meterMax; // 1
        this.minDetail = GAME_DATA.config.meterMin; // -1
        this.activeDisaster = null;
        this.timer = null;
        this.timeLeft = 10;
        this.maxTime = 10;
        this.selectedOption = null; // Track selected answer
    }

    init() {
        // Initialize 4 players
        for (let i = 0; i < 4; i++) {
            this.players.push({
                id: i,
                name: `JOGADOR ${i + 1}`,
                climateMeter: 0, // Starts neutral
                score: 0
            });
        }
        
        // Load questions
        this.questions = [...GAME_DATA.questions];
        
        this.ui = new UI(this);
        this.ui.initDashboard();
        this.ui.showStartScreen();
    }

    start() {
        this.currentRound = 1;
        this.currentPlayerIndex = 0;
        this.activeDisaster = null;
        this.ui.showGameScreen();
        this.startTurn();
    }
    
    selectOption(score) {
        this.selectedOption = score;
        this.ui.enableConfirmBtn();
    }

    confirmChoice() {
        if (this.selectedOption !== null) {
            this.ui.disableInteraction(); // Lock everything
            this.handleAnswer(this.selectedOption);
            this.selectedOption = null; // Reset
            this.ui.disableConfirmBtn();
        }
    }

    startTurn() {
        const player = this.players[this.currentPlayerIndex];
        
        // Reset Disaster
        this.activeDisaster = null;
        this.ui.clearDisasters();

        // Check Climate Meter for Disaster
        if (player.climateMeter <= -1) {
            this.triggerDisaster();
        }

        // Get Question for current round
        const question = this.getQuestionForRound(this.currentRound);
        if (!question) {
            console.error("No questions left for this round!");
            this.nextTurn();
            return;
        }

        this.ui.renderTurn(player, this.currentRound, question, this.activeDisaster);
        this.startTimer();
    }

    startTimer() {
        this.stopTimer(); // Clear existing
        this.timeLeft = this.maxTime;
        this.ui.updateTimer(this.timeLeft);

        this.timer = setInterval(() => {
            // FIRE DISASTER: Time goes 2x faster (decrement 2 per sec effectively, or just faster ticks? 
            // User said "2x faster", so let's drop by 1 every 500ms? Or drop by 2 every 1000ms.
            // Let's drop by 1, but run interval based on disaster. 
            // Better: Keep 1s interval but decrease timeLeft by modifier.
            
            let decrement = 1;
            if (this.activeDisaster && this.activeDisaster.id === 'fire') {
                 decrement = 2; 
                 // Visual cue handled in CSS, logic here
            }

            this.timeLeft -= decrement;
            if (this.timeLeft < 0) this.timeLeft = 0;
            
            this.ui.updateTimer(this.timeLeft, this.maxTime);
            
            if (this.timeLeft <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    handleTimeout() {
        this.stopTimer();
        alert("TEMPO ESGOTADO! Penalidade aplicada.");
        this.handleAnswer(-1); // Penalty for timeout
    }

    triggerDisaster() {
        const disasters = GAME_DATA.disasters;
        const randomDisaster = disasters[Math.floor(Math.random() * disasters.length)];
        this.activeDisaster = randomDisaster;
        this.ui.applyDisasterEffect(randomDisaster);
    }

    getQuestionForRound(round) {
        // Filter questions by round and unused
        const roundQuestions = this.questions.filter(q => q.round === round && !q.used);
        if (roundQuestions.length === 0) return null;
        
        // Random pick
        const randomIndex = Math.floor(Math.random() * roundQuestions.length);
        const q = roundQuestions[randomIndex];
        q.used = true; // Mark as used
        return q;
    }

    handleAnswer(score) {
        this.stopTimer(); // Stop timer when answered
        
        // 1. Clear Disaster Immediately -> REMOVED per user request to keep effects
        // this.ui.clearDisasters();

        const player = this.players[this.currentPlayerIndex];
        
        // 2. Update Meter
        player.climateMeter += score;
        if (player.climateMeter > this.maxDetail) player.climateMeter = this.maxDetail;
        if (player.climateMeter < this.minDetail) player.climateMeter = this.minDetail;

        // 3. Score Calculation & Animation
        const points = this.calculatePoints(score, this.timeLeft);
        player.score += points;
        this.ui.showScorePopup(points, Math.ceil(this.timeLeft), score);

        // 4. Force UI Update
        this.ui.updatePlayerCard(player); 

        // 5. Wait for Linger (1.5s)
        setTimeout(() => {
            // Next Turn Logic
            this.questionsAnsweredInRound++;
            const questionsPerRound = 4 * GAME_DATA.config.questionsPerPlayerPerRound;

            if (this.questionsAnsweredInRound >= questionsPerRound) {
                this.endRound();
            } else {
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;
                this.startTurn();
            }
        }, 1000);
    }

    endRound() {
        if (this.currentRound >= GAME_DATA.config.maxRounds) {
            this.endGame();
        } else {
            this.currentRound++;
            this.questionsAnsweredInRound = 0;
            this.currentPlayerIndex = 0; // Back to P1 or rotating? Let's reset to P1 for simplicity
            alert(`FIM DO ROUND ${this.currentRound - 1}! PREPAREM-SE PARA O FUTURO...`);
            this.startTurn();
        }
    }

    calculatePoints(choicescore, time) {
        let base = 5; // Neutral
        if (choicescore > 0) base = 10; // Good
        if (choicescore < 0) base = -5; // Bad
        
        // Multiplier: Time (min 1 second)
        const timeMult = Math.max(1, Math.ceil(time));
        return base * timeMult;
    }

    endGame() {
        this.ui.showEndScreen(this.players);
        this.saveScores();
    }

    saveScores() {
        const leaderboard = JSON.parse(localStorage.getItem('climate_leaderboard') || '[]');
        
        this.players.forEach(p => {
            leaderboard.push({
                name: p.name,
                score: p.score,
                date: new Date().toISOString()
            });
        });

        // Sort desc
        leaderboard.sort((a, b) => b.score - a.score);
        // Keep top 10
        const top10 = leaderboard.slice(0, 10);
        
        localStorage.setItem('climate_leaderboard', JSON.stringify(top10));
        this.ui.renderLeaderboard(top10);
    }
}

class UI {
    constructor(game) {
        this.game = game;
        this.els = {
            app: document.getElementById('app'),
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            end: document.getElementById('end-screen'),
            dashboard: document.getElementById('players-dashboard'),
            round: document.getElementById('round-display'),
            qText: document.getElementById('question-text'),
            answers: document.getElementById('answers-grid'),
            disaster: document.getElementById('disaster-warning'),
            disasterName: document.getElementById('disaster-name'),
            timer: document.getElementById('timer-display'),
            confirmBtn: document.getElementById('confirm-btn'),
            scorePopup: document.getElementById('score-popup'),
            leaderboardBody: document.getElementById('leaderboard-body')
        };

        document.getElementById('start-btn').addEventListener('click', () => game.start());
        document.getElementById('restart-btn').addEventListener('click', () => location.reload());
        
        // Confirm Button
        this.els.confirmBtn.addEventListener('click', () => game.confirmChoice());
    }

    showStartScreen() {
        this.els.start.classList.remove('hidden');
        this.els.game.classList.add('hidden');
        this.els.end.classList.add('hidden');
    }

    showGameScreen() {
        this.els.start.classList.add('hidden');
        this.els.game.classList.remove('hidden');
    }

    showEndScreen(players) {
        this.els.game.classList.add('hidden');
        this.els.end.classList.remove('hidden');
        
        const resultsDiv = document.getElementById('final-results');
        resultsDiv.innerHTML = players.map(p => `
            <div class="result-card">
                <h3>${p.name}</h3>
                <p>Pontuação Final: <span class="score-highlight">${p.score}</span></p>
                <p>Status Climático: ${this.getClimateStatus(p.climateMeter)}</p>
                <div class="mini-bar" style="width:${this.getMeterPercent(p.climateMeter)}%"></div>
            </div>
        `).join('');
    }

    renderLeaderboard(data) {
        this.els.leaderboardBody.innerHTML = data.map((entry, i) => `
            <tr>
                <td>#${i+1}</td>
                <td>${entry.name}</td>
                <td>${entry.score}</td>
            </tr>
        `).join('');
    }

    showScorePopup(points, time, typeScore) {
        const el = this.els.scorePopup;
        el.classList.remove('hidden');
        
        let label = "NEUTRO";
        let base = 5;
        let color = "var(--text-color)";
        
        if (typeScore > 0) { label = "ÓTIMO"; base = 10; color = "var(--meter-good)"; }
        if (typeScore < 0) { label = "CRÍTICO"; base = -5; color = "var(--meter-bad)"; }
        
        // Setup Initial HTML
        el.style.color = color;
        el.innerHTML = `
            <div class="score-anim-box">
                <span class="score-label">${label}</span>
                <div class="score-math">
                    <span class="base-pts">${base}</span>
                    <span class="x-icon">×</span>
                    <span class="time-mult" id="anim-time">${time}s</span>
                </div>
                <div class="score-total" id="anim-total">0</div>
            </div>
        `;
        
        // Animation Logic: Smooth Drain (60fps)
        const duration = 1000; // 1 second smooth animation
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing (optional, but Linear feels more mechanical/industrial)
            // Using easeOutQuad for better feel: 1 - (1 - x) * (1 - x)
            const ease = 1 - (1 - progress) * (1 - progress);
            
            // Interpolate
            const currentVisualTime = Math.max(0, time - (time * ease));
            const currentVisualScore = Math.min(points, 0 + (points * ease));
            
            const tEl = document.getElementById('anim-time');
            const sEl = document.getElementById('anim-total');
            
            if (tEl && sEl) {
                // Show 1 decimal place for time to make it look fast and techy
                tEl.innerText = `${currentVisualTime.toFixed(1)}s`;
                sEl.innerText = `= ${Math.floor(currentVisualScore)}`;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Final State
                if (tEl) tEl.innerText = `0.0s`;
                if (sEl) {
                    sEl.innerText = `= ${points}`;
                    // Big impact at the end
                    sEl.style.transform = "scale(1.2)";
                    sEl.style.transition = "transform 0.2s";
                    setTimeout(() => sEl.style.transform = "scale(1)", 200);
                }
            }
        };
        
        requestAnimationFrame(animate);
        
        // Hide after 1.8s (giving a bit more time to read final result)
        setTimeout(() => {
            el.classList.add('hidden');
        }, 1800);
    }

    getClimateStatus(score) {
        if (score === 1) return "UTIOPIA VERDE (Excelente)";
        if (score === 0) return "ESTÁVEL (Neutro)";
        return "COLAPSO ECOLÓGICO (Crítico)";
    }


    initDashboard() {
        this.els.dashboard.innerHTML = this.game.players.map(p => `
            <div class="player-card" id="p-card-${p.id}">
                <div class="card-header">
                    <span class="player-name">${p.name}</span>
                    <span class="player-score" id="p-score-${p.id}">PTS: 0</span>
                </div>
                <label class="meter-label">Aquecimento Global</label>
                <div class="mini-meter">
                    <div class="mini-meter-fill" id="p-meter-${p.id}" style="width: 50%; background-color: yellow"></div>
                </div>
            </div>
        `).join('');
    }

    updatePlayerCard(player) {
        const meter = document.getElementById(`p-meter-${player.id}`);

        if (!meter) return;

        // Update Score Text
        const scoreEl = document.getElementById(`p-score-${player.id}`);
        if (scoreEl) scoreEl.innerText = `PTS: ${player.score}`;

        const percent = this.getMeterPercent(player.climateMeter);
        const color = this.getMeterColor(player.climateMeter);
        
        meter.style.width = `${percent}%`;
        meter.style.backgroundColor = color;

        // Pulse check
        if (player.climateMeter <= -0.8) {
            meter.classList.add('pulse-red');
        } else {
            meter.classList.remove('pulse-red');
        }
    }

    renderTurn(activePlayer, round, question, disaster) {
        // UI Updates
        this.els.round.innerText = `ANO: ${this.getYear(round)} | ${this.game.players[this.game.currentPlayerIndex].name}`;
        
        // Update Dashboard (Preserve DOM for transitions)
        this.game.players.forEach((p, index) => {
             const card = document.getElementById(`p-card-${p.id}`);
             const meter = document.getElementById(`p-meter-${p.id}`);
             const isActive = index === this.game.currentPlayerIndex;
             
             // Update Active State
             if (isActive) card.classList.add('active');
             else card.classList.remove('active');

             // Update Meter
             const percent = this.getMeterPercent(p.climateMeter);
             const color = this.getMeterColor(p.climateMeter);
             
             meter.style.width = `${percent}%`;
             meter.style.backgroundColor = color;

             // Pulsate if full (High Warming / Bad State)
             // Internal -1 is now 100% displayed.
             if (p.climateMeter <= -0.8) {
                 meter.classList.add('pulse-red');
             } else {
                 meter.classList.remove('pulse-red');
             }
        });

        // Question
        let qText = question.text;
        
        // Disaster Logic: Flood (Wash away words)
        if (disaster && disaster.id === 'flood') {
           qText = this.applyFloodEffect(qText);
        }

        this.els.qText.innerHTML = qText; // Changed from innerText to innerHTML to support spans
        
        // Answers
        this.els.answers.innerHTML = '';
        this.disableConfirmBtn(); // Reset confirm button state per turn

        question.options.forEach((opt, idx) => {
            let optText = opt.text;
            if (disaster && disaster.id === 'flood') {
                optText = this.applyFloodEffect(optText);
            }

            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.innerHTML = `${optText}`; 
            btn.dataset.id = idx;
            
            btn.onclick = () => {
                // UI Highlight
                document.querySelectorAll('.answer-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                // Logic
                this.game.selectOption(opt.score);
            };
            this.els.answers.appendChild(btn);
        });

        // Disaster UI
        if (disaster) {
            this.els.disaster.classList.remove('hidden');
            this.els.disasterName.innerText = disaster.name + " - " + disaster.description;
        } else {
            this.els.disaster.classList.add('hidden');
        }
    }

    enableConfirmBtn() {
        this.els.confirmBtn.disabled = false;
        this.els.confirmBtn.classList.add('active');
    }

    disableConfirmBtn() {
        this.els.confirmBtn.disabled = true;
        this.els.confirmBtn.classList.remove('active');
    }

    disableInteraction() {
        // Disable all answer buttons
        const btns = document.querySelectorAll('.answer-btn');
        btns.forEach(btn => btn.disabled = true);
        this.disableConfirmBtn();
    }

    applyDisasterEffect(disaster) {
        document.body.classList.add(disaster.class);
    }

    clearDisasters() {
        document.body.className = ''; // Reset body classes
        this.els.disaster.classList.add('hidden');
    }

    getYear(round) {
        if (round === 1) return 2025;
        if (round === 2) return 2050;
        return 2100;
    }

    getMeterPercent(val) {
        // Map -1 (Bad/MaxWarming) to 100%
        // Map 1 (Good/NoWarming) to 0%
        return (1 - ((val + 1) / 2)) * 100;
    }

    getMeterColor(val) {
        // High Warming (Low Val) = Red
        if (val < 0) return 'var(--meter-bad)'; // Red
        if (val > 0) return 'var(--meter-good)'; // Green (Low bars)
        return 'yellow';
    }

    applyFloodEffect(text) {
        const words = text.split(' ');
        return words.map(word => {
            // 25% chance to wash away a word
            if (Math.random() < 0.30) {
                return `<span class="washed-out-text">${word}</span>`;
            }
            return word;
        }).join(' ');
    }

    updateTimer(time, maxTime) {
        // Text Update
        if (this.els.timer) {
            this.els.timer.innerText = `TEMPO: ${Math.ceil(time)}s`;
            if (time <= 3) this.els.timer.style.color = 'red';
            else this.els.timer.style.color = 'var(--accent-color)';
        }

        // Spiral Border Update
        // Calculate angle: 0deg when full, 360deg when empty? Or refill?
        // "filled up spirally as the timer goes down" -> Starts empty (or full) and fills up?
        // Let's assume fills up to 360deg as time drops.
        const percentage = (maxTime - time) / maxTime;
        const angle = percentage * 360; 
        
        // CSS Variable update
        if (this.els.app) {
           this.els.app.style.setProperty('--timer-angle', `${angle}deg`);
        }
    }
}

// Start
const game = new Game();
game.init();
