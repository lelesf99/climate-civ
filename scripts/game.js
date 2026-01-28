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
    }

    init() {
        // Initialize 4 players
        for (let i = 0; i < 4; i++) {
            this.players.push({
                id: i,
                name: `JOGADOR ${i + 1}`,
                climateMeter: 0 // Starts neutral
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
        const player = this.players[this.currentPlayerIndex];
        
        // Update Meter (Clamped -1 to 1)
        player.climateMeter += score;
        if (player.climateMeter > this.maxDetail) player.climateMeter = this.maxDetail;
        if (player.climateMeter < this.minDetail) player.climateMeter = this.minDetail;

        // Next Turn Logic
        this.questionsAnsweredInRound++;
        const questionsPerRound = 4 * GAME_DATA.config.questionsPerPlayerPerRound; // 4 players * 2 questions

        if (this.questionsAnsweredInRound >= questionsPerRound) {
            this.endRound();
        } else {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;
            this.startTurn();
        }
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

    endGame() {
        this.ui.showEndScreen(this.players);
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
            timer: document.getElementById('timer-display')
        };

        document.getElementById('start-btn').addEventListener('click', () => game.start());
        document.getElementById('restart-btn').addEventListener('click', () => location.reload());
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
                <p>Status Climático: ${this.getClimateStatus(p.climateMeter)}</p>
                <div class="mini-bar" style="width:${this.getMeterPercent(p.climateMeter)}%"></div>
            </div>
        `).join('');
    }

    getClimateStatus(score) {
        if (score === 1) return "UTIOPIA VERDE (Excelente)";
        if (score === 0) return "ESTÁVEL (Neutro)";
        return "COLAPSO ECOLÓGICO (Crítico)";
    }


    initDashboard() {
        this.els.dashboard.innerHTML = this.game.players.map(p => `
            <div class="player-card" id="p-card-${p.id}">
                <span class="player-name">${p.name}</span>
                <label class="meter-label">Aquecimento Global</label>
                <div class="mini-meter">
                    <div class="mini-meter-fill" id="p-meter-${p.id}" style="width: 50%; background-color: yellow"></div>
                </div>
            </div>
        `).join('');
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
        question.options.forEach(opt => {
            let optText = opt.text;
            if (disaster && disaster.id === 'flood') {
                optText = this.applyFloodEffect(optText);
            }

            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.innerHTML = `${optText}`; // Changed to innerHTML
            btn.onclick = () => this.game.handleAnswer(opt.score);
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
