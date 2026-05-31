import { writable } from 'svelte/store';
import type { GameData } from '../data/gameData';

// ─── Enums ───────────────────────────────────────────────────

export const Role = {
	TEACHER: 'teacher',
	PLAYER: 'player',
	NONE: null
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];

export const GamePhase = {
	LOGIN: 'login',
	ROLE_SELECTION: 'role_selection',
	TEACHER_SETUP: 'teacher_setup',
	PLAYER_JOIN: 'player_join',
	LOBBY: 'lobby',
	ACTIVE: 'active',
	RESULTS: 'results',
	FINISHED: 'finished'
} as const;

export type GamePhaseType = (typeof GamePhase)[keyof typeof GamePhase];

// ─── Session Data Types ──────────────────────────────────────

export interface HistoryItem {
	scenarioId: string;
	scenarioText: string;
	resources: Record<string, number>;
	score: number;
	initiatives: Array<{ id: string; name: string; ideal: number }>;
}

export interface PlayerData {
	name: string;
	score: number;
	submitted: boolean;
	resources: Record<string, number>;
	isActive?: boolean;
	isWaiting?: boolean;
	continent?: string;
	currentScenarioId?: string | null;
	lastScenarioId?: string | null;
	difficulty?: string;
	readyToRestart?: boolean;
	timeLeft?: number;
	connections?: Record<string, boolean>;
	history?: HistoryItem[];
}

export interface SessionData {
	code: string;
	hostId: string;
	status: 'waiting' | 'active' | 'results' | 'finished';
	round: number;
	scenarioId: string | null;
	timer: number;
	players: Record<string, PlayerData>;
	createdAt: number;
	customGameData?: GameData | null;
}

// ─── Stores ──────────────────────────────────────────────────

export const role = writable<RoleType>(Role.NONE);
export const phase = writable<GamePhaseType>(GamePhase.ROLE_SELECTION);
export const uid = writable<string | null>(null);
export const sessionCode = writable<string | null>(null);
export const sessionData = writable<SessionData | null>(null);
export const loading = writable<boolean>(false);
/** The teacher UID that owns the current session (needed for RTDB paths) */
export const hostUid = writable<string | null>(null);

// ─── Helpers ─────────────────────────────────────────────────

export function resetGameStore(): void {
	role.set(Role.NONE);
	phase.set(GamePhase.ROLE_SELECTION);
	uid.set(null);
	sessionCode.set(null);
	sessionData.set(null);
	loading.set(false);
	hostUid.set(null);
}
