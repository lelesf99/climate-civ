import {
	get,
	onDisconnect,
	onValue,
	push,
	ref,
	remove,
	set,
	update,
	serverTimestamp,
	type Unsubscribe
} from 'firebase/database';
import { realTimeDB } from '../../firebase/config';
import type { SessionData, PlayerData } from '../stores/game.store';
import type { GameData } from '../data/gameData';

// ─── Helpers ─────────────────────────────────────────────────

const generateSessionCode = (): string =>
	Math.floor(1000 + Math.random() * 9000).toString();

function sessionRef(hostUid: string, code: string) {
	return ref(realTimeDB, `${hostUid}/sessions/${code}`);
}

function sessionIndexRef(code: string) {
	return ref(realTimeDB, `sessionIndex/${code}`);
}

// ─── Teacher: Session CRUD ───────────────────────────────────

export async function createSession(hostUid: string, customGameData?: GameData): Promise<string> {
	const code = generateSessionCode();
	const sRef = sessionRef(hostUid, code);

	// Check for code collision
	const snap = await get(sRef);
	if (snap.exists()) {
		return createSession(hostUid, customGameData); // Retry on collision
	}

	const initialData = {
		code,
		hostId: hostUid,
		status: 'waiting',
		round: 1,
		scenarioId: null,
		timer: customGameData?.config?.timerSeconds || 90,
		players: {},
		createdAt: serverTimestamp(),
		customGameData: customGameData || null
	};

	// Perform an atomic multi-path update to write both the session and the lookup index together
	const updates: Record<string, unknown> = {};
	updates[`${hostUid}/sessions/${code}`] = initialData;
	updates[`sessionIndex/${code}`] = hostUid;

	await update(ref(realTimeDB), updates);

	return code;
}

export async function getTeacherSessions(hostUid: string): Promise<SessionData[]> {
	const sessionsRef = ref(realTimeDB, `${hostUid}/sessions`);
	const snap = await get(sessionsRef);
	if (!snap.exists()) return [];

	const data = snap.val() as Record<string, SessionData>;
	return Object.entries(data)
		.map(([key, val]) => ({ ...val, code: key }))
		.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function deleteSession(hostUid: string, code: string): Promise<void> {
	const updates: Record<string, null> = {};
	updates[`${hostUid}/sessions/${code}`] = null;
	updates[`sessionIndex/${code}`] = null;
	await update(ref(realTimeDB), updates);
}

export async function cancelSession(hostUid: string, code: string): Promise<void> {
	const updates: Record<string, null> = {};
	updates[`${hostUid}/sessions/${code}`] = null;
	updates[`sessionIndex/${code}`] = null;
	await update(ref(realTimeDB), updates);
}

// ─── Session Sync ────────────────────────────────────────────

export function onSessionUpdate(
	hostUid: string,
	code: string,
	callback: (data: SessionData | null) => void
): Unsubscribe {
	const sRef = sessionRef(hostUid, code);
	return onValue(sRef, (snapshot) => {
		callback(snapshot.exists() ? (snapshot.val() as SessionData) : null);
	});
}

export function stopSessionSync(unsubscribeFn: Unsubscribe | null): void {
	if (unsubscribeFn) unsubscribeFn();
}

export async function updateSessionStatus(
	hostUid: string,
	code: string,
	status: string
): Promise<void> {
	await update(sessionRef(hostUid, code), { status });
}

export async function updateSessionTimer(
	hostUid: string,
	code: string,
	timer: number
): Promise<void> {
	await update(sessionRef(hostUid, code), { timer });
}

// ─── Student: Join Flow ──────────────────────────────────────

/**
 * Look up the host UID for a given session code via the sessionIndex.
 */
export async function resolveSessionHost(code: string): Promise<string | null> {
	const snap = await get(sessionIndexRef(code));
	return snap.exists() ? (snap.val() as string) : null;
}

export async function joinSession(
	hostUid: string,
	code: string,
	playerUid: string,
	playerName: string
): Promise<void> {
	const sRef = sessionRef(hostUid, code);
	const snap = await get(sRef);

	if (!snap.exists()) throw new Error('Session not found.');

	const sessionData = snap.val() as SessionData;

	// Check if player is already in the session (reconnect)
	if (sessionData.players?.[playerUid]) {
		await update(ref(realTimeDB, `${hostUid}/sessions/${code}/players/${playerUid}`), {
			isActive: true
		});
		setupPresence(hostUid, code, playerUid);
		return;
	}

	// Check capacity
	const currentCount = Object.keys(sessionData.players || {}).length;
	const MAX_PLAYERS = 6;
	if (currentCount >= MAX_PLAYERS) {
		throw new Error(`Session full! Maximum of ${MAX_PLAYERS} players.`);
	}

	const isWaiting = sessionData.status !== 'waiting';

	await set(ref(realTimeDB, `${hostUid}/sessions/${code}/players/${playerUid}`), {
		name: playerName.toUpperCase(),
		score: 0,
		submitted: false,
		resources: {},
		isActive: true,
		isWaiting
	});

	setupPresence(hostUid, code, playerUid);
}

export async function leaveSession(
	hostUid: string,
	code: string,
	playerUid: string
): Promise<void> {
	await update(ref(realTimeDB, `${hostUid}/sessions/${code}/players/${playerUid}`), {
		isActive: false
	});
}

export async function submitAllocation(
	hostUid: string,
	code: string,
	playerUid: string,
	resources: Record<string, number>,
	timeLeft: number
): Promise<void> {
	await update(ref(realTimeDB, `${hostUid}/sessions/${code}/players/${playerUid}`), {
		resources,
		submitted: true,
		timeLeft
	});
}

export async function signalRestartReady(
	hostUid: string,
	code: string,
	playerUid: string,
	ready: boolean
): Promise<void> {
	await update(ref(realTimeDB, `${hostUid}/sessions/${code}/players/${playerUid}`), {
		readyToRestart: ready
	});
}

// ─── Teacher: Game Lifecycle ─────────────────────────────────

export async function startNextScenario(
	hostUid: string,
	code: string,
	assignments: Record<string, string>,
	round?: number,
	allPlayersData?: Record<string, PlayerData>
): Promise<void> {
	const updates: Record<string, unknown> = {
		status: 'active',
		timer: 90
	};

	if (round) updates.round = round;

	// Reset all players
	if (allPlayersData) {
		for (const uid of Object.keys(allPlayersData)) {
			updates[`players/${uid}/submitted`] = false;
			updates[`players/${uid}/resources`] = {};
			updates[`players/${uid}/readyToRestart`] = false;
			updates[`players/${uid}/isWaiting`] = false;
		}
	}

	// Assign scenarios
	for (const [uid, scenarioId] of Object.entries(assignments)) {
		updates[`players/${uid}/currentScenarioId`] = scenarioId;
	}

	await update(sessionRef(hostUid, code), updates);
}

export async function resetSession(
	hostUid: string,
	code: string,
	playerUids: string[],
	allPlayersData: Record<string, PlayerData>
): Promise<void> {
	const updates: Record<string, unknown> = {
		status: 'waiting',
		round: 1,
		scenarioId: null,
		timer: 90
	};

	for (const uid of playerUids) {
		const p = allPlayersData[uid];
		if (p?.isActive === false) {
			updates[`players/${uid}`] = null; // Remove disconnected players
		} else {
			updates[`players/${uid}/score`] = 0;
			updates[`players/${uid}/submitted`] = false;
			updates[`players/${uid}/resources`] = {};
			updates[`players/${uid}/readyToRestart`] = false;
			updates[`players/${uid}/history`] = [];
			updates[`players/${uid}/difficulty`] = 'good';
			updates[`players/${uid}/currentScenarioId`] = null;
			updates[`players/${uid}/isWaiting`] = false;
		}
	}

	await update(sessionRef(hostUid, code), updates);
}

export async function archiveSession(
	hostUid: string,
	code: string
): Promise<void> {
	await update(sessionRef(hostUid, code), { status: 'finished' });
}

export async function applyResultsUpdate(
	hostUid: string,
	code: string,
	updates: Record<string, unknown>
): Promise<void> {
	await update(sessionRef(hostUid, code), updates);
}

export async function setPlayerContinent(
	hostUid: string,
	code: string,
	playerUid: string,
	continent: string
): Promise<void> {
	await update(ref(realTimeDB, `${hostUid}/sessions/${code}/players/${playerUid}`), {
		continent
	});
}

// ─── Presence System ─────────────────────────────────────────

export function setupPresence(hostUid: string, code: string, playerUid: string): void {
	if (!realTimeDB) return;

	const connectedRef = ref(realTimeDB, '.info/connected');
	const connectionsRef = ref(
		realTimeDB,
		`${hostUid}/sessions/${code}/players/${playerUid}/connections`
	);

	onValue(connectedRef, (snap) => {
		if (snap.val() === true) {
			const con = push(connectionsRef);
			onDisconnect(con)
				.remove()
				.then(() => set(con, true));
		}
	});
}