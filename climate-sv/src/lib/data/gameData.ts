/**
 * CLIMATE CIV - MODULAR SCENARIO DATABASE
 *
 * CATEGORIES:
 * 1. early-game: Introductory, single type.
 * 2. mid-game-present: 'good' (peaceful) and 'bad' (conflict/disaster) — Current themes.
 * 3. mid-game-future: 'good' (technology/solarpunk) and 'bad' (cyber-war/catastrophe) — Future themes.
 * 4. endgame: Based on final outcome (utopia, stability, collapse).
 *
 * SCORING STRATEGY (Outliers):
 * - Each scenario has 1 CRITICAL initiative (ideal 60-80%) and 1 IRRELEVANT (ideal 0-5%).
 * - The rest is distributed among the other 3 initiatives.
 */

// ─── Types ───────────────────────────────────────────────────

export interface Initiative {
	id: string;
	name: string;
	ideal: number;
}

export type ScenarioCategory = 'early-game' | 'mid-game-present' | 'mid-game-future' | 'endgame';
export type ScenarioType =
	| 'neutral'
	| 'good'
	| 'bad'
	| 'utopia'
	| 'stability'
	| 'collapse';

export interface Scenario {
	id: string;
	category: ScenarioCategory;
	type: ScenarioType;
	text: string;
	initiatives: Initiative[];
	news?: NewsTemplates; // Optional news specific to this scenario
}

export interface RoundInfo {
	name: string;
	desc: string;
}

export interface NewsTemplates {
	good: string[];
	bad: string[];
	neutral: string[];
}

export interface GameConfig {
	maxRounds: number;
	timerSeconds: number;
	maxResources: number;
}

export interface GameData {
	config: GameConfig;
	continents: string[];
	newsTemplates: NewsTemplates;
	rounds: RoundInfo[];
	scenarios: Scenario[];
}

// ─── Data ────────────────────────────────────────────────────

export const GAME_DATA: GameData = {
	config: {
		maxRounds: 5,
		timerSeconds: 90,
		maxResources: 100
	},
	continents: [
		'NORTH AMERICA',
		'SOUTH AMERICA',
		'EUROPE',
		'AFRICA',
		'ASIA',
		'OCEANIA'
	],
	newsTemplates: {
		good: [
			'Leaders in {continent} celebrate a clean energy record.',
			'Biodiversity indexes rise in {continent}.',
			'Green economy in {continent} attracts new investments.',
			'Population of {continent} supports sustainable reforms.'
		],
		bad: [
			'Red alert in {continent}: Extreme drought hits crops.',
			'Protests in {continent} over lack of water resources.',
			'Wildfires in {continent} generate cross-border smoke.',
			'Infrastructure in {continent} at risk from climate events.'
		],
		neutral: [
			'New trade agreements in {continent} include green clauses.',
			'UN report on {continent} highlights urban challenges.',
			'Conference in {continent} discusses the future of the Arctic.',
			'Economic forum in {continent} debates energy transition.'
		]
	},
	rounds: [
		{ name: 'AWAKENING (2025)', desc: 'Taking control in a changing world.' },
		{ name: 'CHALLENGES OF NOW', desc: 'Dealing with present-day realities.' },
		{ name: 'SHADOWS OF TOMORROW', desc: 'The consequences of early decisions.' },
		{ name: 'NEAR HORIZON', desc: 'Technology and nature in conflict.' },
		{ name: 'THE VERDICT', desc: 'The final legacy of your civilization.' }
	],
	scenarios: [
		// ─── EARLY GAME ───
		{
			id: 'early-un-report',
			category: 'early-game',
			type: 'neutral',
			text: 'New government takes office under international pressure; UN report demands an immediate 40% emissions cut by 2030.',
			initiatives: [
				{ id: 'energy', name: 'Clean Energy Matrix', ideal: 45 },
				{ id: 'forest', name: 'Protected Biome Preservation', ideal: 30 },
				{ id: 'industry', name: 'Green Industry Subsidies', ideal: 15 },
				{ id: 'education', name: 'Sustainable Curriculum Reforms', ideal: 10 },
				{ id: 'coal', name: 'Coal Power Plant Expansion', ideal: 0 }
			]
		},
		// ─── MID-GAME PRESENT ───
		{
			id: 'mid-good-boom',
			category: 'mid-game-present',
			type: 'good',
			text: 'Green investment boom drives the economy; country becomes a zero-carbon technology exporter.',
			initiatives: [
				{ id: 'randd', name: 'Decarbonization R&D', ideal: 40 },
				{ id: 'export', name: 'Sustainable Export Promotion', ideal: 30 },
				{ id: 'jobs', name: 'Green Economy Training', ideal: 20 },
				{ id: 'credit', name: 'Preferential Credit Lines', ideal: 10 },
				{ id: 'coal', name: 'Reopening Coal Mines', ideal: 0 }
			]
		},
		{
			id: 'mid-bad-heatwave',
			category: 'mid-game-present',
			type: 'bad',
			text: 'Extreme heat waves break records; overcrowded hospitals and energy rationing become reality.',
			initiatives: [
				{ id: 'health', name: 'Emergency Public Health Action', ideal: 45 },
				{ id: 'grid', name: 'Energy Grid Stabilization', ideal: 25 },
				{ id: 'cool', name: 'Public Thermal Shelters', ideal: 20 },
				{ id: 'water', name: 'Emergency Water Distribution', ideal: 10 },
				{ id: 'price', name: 'Energy Price Deregulation', ideal: 0 }
			]
		},
		// ─── MID-GAME FUTURE ───
		{
			id: 'future-good-fusion',
			category: 'mid-game-future',
			type: 'good',
			text: 'Commercial Nuclear Fusion: First infinite energy plant inaugurated, ending the fossil era.',
			initiatives: [
				{ id: 'fusion', name: 'Fusion Reactor Infrastructure', ideal: 45 },
				{ id: 'grid', name: 'Global Superconductor Grid', ideal: 25 },
				{ id: 'sc', name: 'Post-scarcity Materials Research', ideal: 20 },
				{ id: 'edu', name: 'Large-scale Professional Retraining', ideal: 10 },
				{ id: 'oil', name: 'Shale Exploration Subsidies', ideal: 0 }
			]
		},
		{
			id: 'future-bad-hack',
			category: 'mid-game-future',
			type: 'bad',
			text: "'Deep Frost' hack attack disables climate domes; millions of lives depend on manual system repair.",
			initiatives: [
				{ id: 'manual', name: 'Emergency Mechanical Operation', ideal: 40 },
				{ id: 'cyber', name: 'Quantum Cryptography Protocols', ideal: 30 },
				{ id: 'shield', name: 'Backup Energy Fortification', ideal: 20 },
				{ id: 'civil', name: 'Dome Survival Training', ideal: 10 },
				{ id: 'wifi', name: 'Unsecured Open Cloud Systems', ideal: 0 }
			]
		},
		// ─── ENDGAME ───
		{
			id: 'end-utopia-mars',
			category: 'endgame',
			type: 'utopia',
			text: 'Green Utopia: Civilization achieves absolute harmony; humanity begins biological colonization of Mars.',
			initiatives: [
				{ id: 'space', name: 'Planetary Terraforming Project', ideal: 40 },
				{ id: 'mind', name: 'Collective Ecological Consciousness', ideal: 30 },
				{ id: 'bio', name: 'Living Biological Art & Engineering', ideal: 20 },
				{ id: 'peace', name: 'Stellar Peace Maintenance', ideal: 10 },
				{ id: 'war', name: 'Archaic Energy Source Consumption', ideal: 0 }
			]
		},
		{
			id: 'end-stable-dome',
			category: 'endgame',
			type: 'stability',
			text: 'Controlled Stability: The climate was stabilized, but life occurs under strict consumption and space rules.',
			initiatives: [
				{ id: 'manage', name: 'Rigorous Life Cycle Management', ideal: 40 },
				{ id: 'dome', name: 'Biosphere Structural Maintenance', ideal: 30 },
				{ id: 'reg', name: 'Per Capita Carbon Regulation', ideal: 20 },
				{ id: 'edu', name: 'Human Memory Preservation', ideal: 10 },
				{ id: 'grow', name: 'Unchecked Consumption Incentive', ideal: 0 }
			]
		},
		{
			id: 'end-collapse-ruins',
			category: 'endgame',
			type: 'collapse',
			text: 'Total Collapse: The dust settled over the ruins; small clans fight for what remains in a hostile world.',
			initiatives: [
				{ id: 'scavenge', name: 'Lost Technology Recovery', ideal: 40 },
				{ id: 'water', name: 'Toxic Water Purification', ideal: 30 },
				{ id: 'tribal', name: 'Community Bond Strengthening', ideal: 20 },
				{ id: 'oral', name: 'History Transmission for the Future', ideal: 10 },
				{ id: 'factory', name: 'Heavy Combustion Industrialization', ideal: 0 }
			]
		}
	]
};
