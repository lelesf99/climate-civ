import type { Initiative } from '$lib/data/gameData';

/**
 * Calculate a player's impact score for a round based on how close
 * their resource allocation is to the ideal distribution.
 *
 * Scoring:
 *  - Sums deviation from ideal for each initiative
 *  - Converts to 0-100 accuracy score (150 max deviation → 0%)
 *  - Adds a time bonus of up to 5 points for fast decisions
 */
export function calculateImpactScore(
	resources: Record<string, number>,
	initiatives: Initiative[],
	timeLeft: number = 0
): number {
	let totalDeviation = 0;

	for (const init of initiatives) {
		const playerVal = resources[init.id] || 0;
		totalDeviation += Math.abs(playerVal - init.ideal);
	}

	const accuracy = Math.max(0, 1 - totalDeviation / 150);
	let score = Math.floor(accuracy * 100);

	// Time bonus: reward speed (up to +5 pts)
	if (score > 0) {
		const maxBonus = 5;
		const maxTime = 90;
		score += Math.floor((timeLeft / maxTime) * maxBonus);
	}

	return Math.min(100, score);
}

/**
 * Determine the scenario category for a given round number.
 */
export function getCategoryForRound(
	round: number,
	maxRounds: number
): string {
	if (round === 1) return 'early-game';
	if (round === maxRounds) return 'endgame';

	// For maxRounds=5: R2 → present, R3/R4 → future
	if (maxRounds === 5) {
		return round === 2 ? 'mid-game-present' : 'mid-game-future';
	}

	// Generic split for other maxRound values
	const midRounds = maxRounds - 2;
	const currentMidIndex = round - 1;
	return currentMidIndex <= Math.ceil(midRounds / 2)
		? 'mid-game-present'
		: 'mid-game-future';
}

/**
 * Determine the endgame difficulty branch based on cumulative score.
 * Returns null for non-endgame categories (branching only applies to round selection).
 */
export function determineDifficultyBranch(
	totalScore: number,
	category: string
): string | null {
	if (category !== 'endgame') return null;

	if (totalScore >= 350) return 'utopia';
	if (totalScore >= 180) return 'stability';
	return 'collapse';
}
