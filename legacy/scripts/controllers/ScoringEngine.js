export class ScoringEngine {
    constructor(game) {
        this.game = game;
    }

    calculateImpactScore(resources, initiatives, timeLeft = 0) {
        let totalDeviation = 0;
        initiatives.forEach(init => {
            const playerVal = resources[init.id] || 0;
            const idealVal = init.ideal;
            totalDeviation += Math.abs(playerVal - idealVal);
        });

        // Max possible deviation is roughly 200
        const accuracy = Math.max(0, 1 - (totalDeviation / 150)); // 150 is a bit more forgiving
        let score = Math.floor(accuracy * 100);

        // --- Time Bonus ---
        // Max timer is usually 90s.
        // We reward up to +5 points for speed.
        if (score > 0) { // Only give bonus if they actually tried to solve it
            const maxBonus = 5;
            const maxTime = 90; 
            const timeBonus = Math.floor((timeLeft / maxTime) * maxBonus);
            score += timeBonus;
        }

        return Math.min(100, score); // Cap at 100
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

    determineDifficultyBranch(totalScore, category) {
        if (category === 'endgame') {
            if (totalScore >= 350) return 'utopia';
            if (totalScore >= 180) return 'stability';
            return 'collapse';
        }
        return null;
    }
}
