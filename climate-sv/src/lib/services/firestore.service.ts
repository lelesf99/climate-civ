import { firestoreDB } from '../../firebase/config';
import { 
	doc, 
	getDoc, 
	setDoc, 
	collection, 
	query, 
	where, 
	getDocs, 
	deleteDoc 
} from 'firebase/firestore';
import type { Scenario, GameConfig } from '../data/gameData';
import { GAME_DATA } from '../data/gameData';

export interface UserDefaults {
	maxRounds: number;
	timerSeconds: number;
	maxResources: number;
	hiddenScenarios?: string[];
}

// ─── USER DEFAULTS ──────────────────────────────────────────

export async function getUserDefaults(uid: string): Promise<UserDefaults> {
	const userRef = doc(firestoreDB, 'users', uid);
	const snap = await getDoc(userRef);
	if (snap.exists()) {
		return snap.data() as UserDefaults;
	}
	// Fallback to game defaults
	return {
		maxRounds: GAME_DATA.config.maxRounds,
		timerSeconds: GAME_DATA.config.timerSeconds,
		maxResources: GAME_DATA.config.maxResources,
		hiddenScenarios: []
	};
}

export async function saveUserDefaults(uid: string, defaults: UserDefaults): Promise<void> {
	const userRef = doc(firestoreDB, 'users', uid);
	await setDoc(userRef, defaults, { merge: true });
}

// ─── SCENARIOS ──────────────────────────────────────────────

/**
 * Fetch all custom scenarios created by the teacher.
 */
export async function getTeacherScenarios(uid: string): Promise<Scenario[]> {
	const scenariosRef = collection(firestoreDB, 'scenarios');
	const q = query(scenariosRef, where('teacherUid', '==', uid));
	const snap = await getDocs(q);
	
	const scenarios: Scenario[] = [];
	snap.forEach((docSnap) => {
		scenarios.push({
			id: docSnap.id,
			...docSnap.data()
		} as Scenario);
	});
	
	return scenarios;
}

/**
 * Save or update a custom scenario.
 */
export async function saveTeacherScenario(uid: string, scenario: Scenario): Promise<void> {
	if (!scenario.id) throw new Error('Scenario ID is required');
	
	const docRef = doc(firestoreDB, 'scenarios', scenario.id);
	// Ensure the document is bound to the teacherUid
	const dataToSave = { ...scenario, teacherUid: uid, lastUpdatedAt: Date.now() };
	
	await setDoc(docRef, dataToSave);
}

/**
 * Delete a custom scenario.
 */
export async function deleteTeacherScenario(scenarioId: string): Promise<void> {
	if (!scenarioId) return;
	const docRef = doc(firestoreDB, 'scenarios', scenarioId);
	await deleteDoc(docRef);
}
