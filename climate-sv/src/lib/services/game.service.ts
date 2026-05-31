import { GAME_DATA } from '$lib/data/gameData';
import type { SessionData, PlayerData } from '$lib/stores/game.store';
import {
	startNextScenario,
	archiveSession,
	applyResultsUpdate,
	updateSessionStatus,
	setPlayerContinent
} from './realtimeDB.service';
import {
	calculateImpactScore,
	getCategoryForRound,
	determineDifficultyBranch
} from './scoring.service';

// ─── Player Helpers ──────────────────────────────────────────

export function isPlayerActive(player: PlayerData | null | undefined): boolean {
	if (!player) return false;
	if (player.isActive === false || player.isWaiting === true) return false;
	if (player.connections === undefined) return true; // Compat for mock/debug players
	return Object.keys(player.connections).length > 0;
}

export function allPlayersSubmitted(players: Record<string, PlayerData>): boolean {
	const activeUids = Object.keys(players).filter((uid) => isPlayerActive(players[uid]));
	if (activeUids.length === 0) return false;
	return activeUids.every((uid) => players[uid].submitted);
}

// ─── Mission Start ───────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export async function startMission(
	hostUid: string,
	code: string,
	sessionData: SessionData
): Promise<void> {
	const activeGameData = sessionData.customGameData || GAME_DATA;
	const playerUids = Object.keys(sessionData.players || {});
	const assignments: Record<string, string> = {};
	const continents = shuffleArray([...activeGameData.continents]);

	let possible = activeGameData.scenarios.filter((s) => s.category === 'early-game');
	if (possible.length === 0) {
		possible = GAME_DATA.scenarios.filter((s) => s.category === 'early-game');
	}

	for (let i = 0; i < playerUids.length; i++) {
		const uid = playerUids[i];
		const scenario = possible[Math.floor(Math.random() * possible.length)];
		assignments[uid] = scenario.id;

		// Assign continent
		const continent = continents[i % continents.length];
		await setPlayerContinent(hostUid, code, uid, continent);
	}

	await startNextScenario(hostUid, code, assignments);
}

// ─── Round Progression ───────────────────────────────────────

export async function calculateResults(
	hostUid: string,
	code: string,
	sessionData: SessionData
): Promise<void> {
	const activeGameData = sessionData.customGameData || GAME_DATA;
	const players = sessionData.players;
	const updates: Record<string, unknown> = {};
	let anyCalculated = false;

	for (const uid of Object.keys(players)) {
		const player = players[uid];
		if (!isPlayerActive(player)) continue;

		// Skip if already scored for this round
		if (player.history && player.history.length >= sessionData.round) continue;
		if (!player.submitted) continue;

		const scenarioId = player.currentScenarioId;
		let scenario = activeGameData.scenarios.find((s) => s.id === scenarioId);
		if (!scenario) {
			scenario = GAME_DATA.scenarios.find((s) => s.id === scenarioId);
		}
		if (!scenario) continue;

		const score = calculateImpactScore(
			player.resources || {},
			scenario.initiatives,
			player.timeLeft || 0
		);

		updates[`players/${uid}/score`] = (player.score || 0) + score;

		// Determine difficulty branch
		let type = player.difficulty || 'good';
		if (score <= 60) type = 'bad';
		else if (score >= 80) type = 'good';
		updates[`players/${uid}/difficulty`] = type;

		// Build history item
		const historyItem = {
			scenarioId: scenario.id,
			scenarioText: scenario.text,
			resources: player.resources || {},
			score,
			initiatives: scenario.initiatives
		};
		const currentHistory = player.history || [];
		updates[`players/${uid}/history`] = [...currentHistory, historyItem];

		updates[`players/${uid}/submitted`] = false;
		updates[`players/${uid}/resources`] = {};
		anyCalculated = true;
	}

	if (anyCalculated) {
		await applyResultsUpdate(hostUid, code, updates);
	}

	await updateSessionStatus(hostUid, code, 'results');
}

export async function advanceFromResults(
	hostUid: string,
	code: string,
	sessionData: SessionData
): Promise<void> {
	const activeGameData = sessionData.customGameData || GAME_DATA;
	if (sessionData.round >= activeGameData.config.maxRounds) {
		await archiveSession(hostUid, code);
	} else {
		await startNextRound(hostUid, code, sessionData);
	}
}

async function startNextRound(
	hostUid: string,
	code: string,
	sessionData: SessionData
): Promise<void> {
	const activeGameData = sessionData.customGameData || GAME_DATA;
	const nextRound = (sessionData.round || 1) + 1;
	const players = sessionData.players;
	const assignments: Record<string, string> = {};
	const maxRounds = activeGameData.config.maxRounds;

	const category = getCategoryForRound(nextRound, maxRounds);

	for (const uid of Object.keys(players)) {
		const player = players[uid];
		if (!isPlayerActive(player)) continue;

		let type = player.difficulty || 'good';
		const branch = determineDifficultyBranch(player.score || 0, category);
		if (branch) type = branch;

		let possible = activeGameData.scenarios.filter(
			(s) => s.category === category && s.type === type
		);

		if (possible.length === 0) {
			possible = GAME_DATA.scenarios.filter(
				(s) => s.category === category && s.type === type
			);
		}

		if (possible.length > 0) {
			assignments[uid] = possible[Math.floor(Math.random() * possible.length)].id;
		} else {
			let fallback = activeGameData.scenarios.filter((s) => s.category === category);
			if (fallback.length === 0) {
				fallback = GAME_DATA.scenarios.filter((s) => s.category === category);
			}
			assignments[uid] =
				fallback.length > 0
					? fallback[Math.floor(Math.random() * fallback.length)].id
					: '';
		}
	}

	await startNextScenario(hostUid, code, assignments, nextRound, players);
}

export async function teacherRestart(
	hostUid: string,
	code: string,
	sessionData: SessionData
): Promise<void> {
	const { resetSession } = await import('./realtimeDB.service');
	const playerUids = Object.keys(sessionData.players || {});
	await resetSession(hostUid, code, playerUids, sessionData.players || {});
}

// ─── Civilization Status ─────────────────────────────────────

export function getCivilizationStatus(totalScore: number, rounds: number): {
	title: string;
	color: string;
} {
	const avg = totalScore / Math.max(rounds, 1);
	if (avg >= 80) return { title: 'GREEN UTOPIA', color: 'var(--green)' };
	if (avg >= 60) return { title: 'STABILITY ACHIEVED', color: 'var(--teal)' };
	if (avg >= 40) return { title: 'CRITICAL STATE', color: 'var(--orange)' };
	return { title: 'TOTAL COLLAPSE', color: 'var(--error-color)' };
}

export function getRoundRating(score: number): {
	label: string;
	color: string;
} {
	if (score >= 85) return { label: 'EXCEPTIONAL', color: 'var(--green)' };
	if (score >= 70) return { label: 'GOOD', color: 'var(--teal)' };
	if (score >= 50) return { label: 'SATISFACTORY', color: 'var(--orange)' };
	return { label: 'CRITICAL', color: 'var(--error-color)' };
}
