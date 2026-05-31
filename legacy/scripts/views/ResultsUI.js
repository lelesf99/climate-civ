import { store, Role } from '../store/gameState.js';

export class ResultsUI {
    constructor(game, uiManager) {
        this.game = game;
        this.uiManager = uiManager;
    }

    showRoundResults(sessionData, player) {
        this.uiManager.hideAll();
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
                <p><strong>${lastHistory.score}</strong> pontos nesta rodada.</p>
            `;

            // Render Initiative Breakdown
            const breakdown = document.getElementById('initiative-breakdown');
            if (breakdown) {
                const results = lastHistory.initiatives.map(init => {
                    const chosen = (lastHistory.resources || {})[init.id] || 0;
                    const ideal = init.ideal;
                    const diff = chosen - ideal;

                    let label = 'NO ALVO';
                    let rank = 'excellent';

                    if (diff < -5) {
                        label = 'DÉFICIT';
                        rank = 'poor';
                    } else if (diff > 10) {
                        label = 'SOBRE-ALOCAÇÃO';
                        rank = 'fair';
                    }

                    return `
                        <div class="initiative-item ${rank}">
                            <span class="initiative-name">${init.name}</span>
                            <span class="initiative-precision ${rank}">${label}</span>
                        </div>
                    `;
                }).join('');

                breakdown.innerHTML = `<h3>ANÁLISE DE DECISÕES</h3>${results}`;
            }

            if (this.uiManager.lastSoundRound !== sessionData.round) {
                if (lastHistory.score >= 70) this.game.audio.play('success');
                else if (lastHistory.score <= 40) this.game.audio.play('fail');
                this.uiManager.lastSoundRound = sessionData.round;
            }
        }
    }

    showTeacherResults(data) {
        this.uiManager.hideAll();
        document.getElementById('teacher-results-screen').classList.remove('hidden');
        document.getElementById('teacher-results-round-number').innerText = data.round;
        document.getElementById('teacher-controls').classList.remove('hidden');

        const grid = document.getElementById('results-player-grid');
        const players = data.players || {};
        grid.innerHTML = Object.keys(players).map(uid => {
            const p = players[uid];
            const last = p.history ? p.history[p.history.length - 1] : null;
            return `
            <div class="player-card">
                <div class="player-card-header">
                    <div class="player-card-id">
                        <span class="player-card-name">${p.name}</span>
                        <span class="player-card-continent">${p.continent}</span>
                    </div>
                    <div class="player-card-score">
                        <span class="score-num">${p.score || 0}</span>
                        <span class="score-lbl">PONTOS</span>
                    </div>
                </div>
                ${last ? `
                <div class="player-card-body">
                    <div class="score-line">RODADA: ${last.score}</div>
                </div>` : ''}
            </div>
            `;
        }).join('');
    }

    renderEndScreen(data) {
        this.uiManager.hideAll();
        document.getElementById('end-screen').classList.remove('hidden');
        document.getElementById('app').classList.remove('clear-app');

        if (store.role === Role.TEACHER) {
            document.getElementById('teacher-end-view').classList.remove('hidden');
            document.getElementById('teacher-controls').classList.remove('hidden');
            
            const grid = document.getElementById('player-outcomes-grid');
            const sortedPlayers = Object.values(data.players).sort((a, b) => (b.score || 0) - (a.score || 0));
            grid.innerHTML = sortedPlayers.map((p, index) => {
                let status = "ESTÁVEL";
                if (p.difficulty === 'utopia') status = "UTOPIA VERDE";
                else if (p.difficulty === 'collapse') status = "COLAPSO TOTAL";

                const rank = index + 1;
                let rankClass = "";
                if (rank === 1) rankClass = "rank-gold";
                else if (rank === 2) rankClass = "rank-silver";
                else if (rank === 3) rankClass = "rank-bronze";

                return `
                    <div class="player-card ${p.difficulty === 'utopia' ? 'good' : (p.difficulty === 'collapse' ? 'critical' : '')} leaderboard-item">
                        <div class="leaderboard-rank ${rankClass}">${rank}</div>
                        <div class="player-card-header">
                            <div class="player-card-id">
                                <span class="player-card-name">${p.name}</span>
                                <span class="player-card-continent">${p.continent || '---'}</span>
                            </div>
                            <div class="player-card-score">
                                <span class="score-num">${p.score || 0}</span>
                                <span class="score-lbl">PONTOS TOTAIS</span>
                            </div>
                        </div>
                        <div class="player-card-body">
                            <div class="score-line">
                                STATUS FINAL: <strong>${status}</strong>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            const readyGrid = document.getElementById('player-ready-grid');
            const readyUids = Object.keys(data.players).filter(uid => data.players[uid].readyToRestart);
            readyGrid.innerHTML = Object.values(data.players).map(p => `
                <div class="player-status-badge ${p.readyToRestart ? 'ready' : ''}">
                    <span class="player-name">${p.name}</span>
                    <div class="pulse-indicator"></div>
                </div>
            `).join('');

            const restartBtn = document.getElementById('teacher-restart-btn');
            restartBtn.disabled = readyUids.length === 0;

        } else {
            document.getElementById('player-end-view').classList.remove('hidden');
            const p = data.players[this.game.uid];
            if (!p) return;

            let theme = p.difficulty || 'stable';
            let title = "ESTABILIDADE ALCANÇADA";

            if (theme === 'utopia') title = "UTOPIA VERDE";
            else if (theme === 'collapse') title = "COLAPSO TOTAL";
            else if (theme === 'bad') title = "CRISE CLIMÁTICA";

            const banner = document.getElementById('player-score-banner');
            if (banner) {
                banner.innerHTML = `
                    <h2 class="outcome-title ${theme}">${title}</h2>
                    <div class="final-score-large">${p.score || 0} <small>PONTOS TOTAIS</small></div>
                `;
            }

            const historyList = document.getElementById('scenario-history');
            if (historyList) {
                historyList.innerHTML = p.history.map((h, i) => {
                    let statusLabel = "NÃO DEFINIDO";
                    let statusClass = "neutral";

                    if (h.score >= 80) { statusLabel = "EXCELENTE"; statusClass = "good"; }
                    else if (h.score >= 60) { statusLabel = "SATISFATÓRIO"; statusClass = "neutral"; }
                    else if (h.score >= 40) { statusLabel = "DÉFICIT"; statusClass = "fair"; }
                    else { statusLabel = "CRÍTICO"; statusClass = "critical"; }

                    return `
                        <div class="player-card ${statusClass}">
                            <div class="player-card-header">
                                <div class="player-card-id">
                                    <span class="player-card-name">RODADA ${i + 1}</span>
                                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                                </div>
                                <div class="player-card-score">
                                    <span class="score-num">${h.score}</span>
                                    <span class="score-lbl">IMPACTO / 100</span>
                                </div>
                            </div>
                            <div class="player-card-body">
                                <p style="font-family: inherit; font-size: 0.95rem; line-height: 1.4; opacity: 0.9; margin: 0;">
                                    ${h.scenarioText}
                                </p>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            const readyBtn = document.getElementById('player-ready-btn');
            if (readyBtn) {
                if (p.readyToRestart) {
                    readyBtn.classList.add('active');
                } else {
                    readyBtn.classList.remove('active');
                }
            }
        }
    }
}
