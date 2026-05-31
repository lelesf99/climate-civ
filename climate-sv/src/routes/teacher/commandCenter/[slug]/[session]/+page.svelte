<script lang="ts">
	import GlitchyTitle from '$lib/components/GlitchyTitle.svelte';
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import RetroButton from '$lib/components/RetroButton.svelte';
	import ButtonGroup from '$lib/components/ButtonGroup.svelte';
	import LoadingBar from '$lib/components/LoadingBar.svelte';
	import NewsTicker from '$lib/components/NewsTicker.svelte';
	import { page } from '$app/state';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		onSessionUpdate,
		stopSessionSync,
		cancelSession,
		updateSessionTimer,
		deleteSession
	} from '$lib/services/realtimeDB.service';
	import {
		startMission,
		calculateResults,
		advanceFromResults,
		teacherRestart,
		isPlayerActive,
		allPlayersSubmitted,
		getCivilizationStatus,
		getRoundRating
	} from '$lib/services/game.service';
	import { GAME_DATA } from '$lib/data/gameData';
	import type { SessionData, PlayerData } from '$lib/stores/game.store';
	import { emitError, emitNotification } from '$lib/stores/snackbar.store';
	import { playSound } from '$lib/services/audio.service';
	import type { Unsubscribe } from 'firebase/database';
	import Rocket from '@lucide/svelte/icons/rocket';
	import Ban from '@lucide/svelte/icons/ban';
	import SkipForward from '@lucide/svelte/icons/skip-forward';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	const teacherUid = $derived(page.params.slug!);
	const sessionCode = $derived(page.params.session!);

	let localSession = $state<SessionData | null>(null);
	let unsubscribe = $state<Unsubscribe | null>(null);
	let timeLeft = $state(GAME_DATA.config.timerSeconds);
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let lastSyncedRound = $state(0);
	let isProcessing = $state(false);

	const activeGameData = $derived(localSession?.customGameData || GAME_DATA);

	let newsItems = $state<string[]>([]);

	function generateNews(count = 1) {
		if (activePlayers.length === 0) return;
		const newItems: string[] = [];
		for (let i = 0; i < count; i++) {
			const randomPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)][1];
			const continent = randomPlayer.continent || 'Geral';
			
			let type: 'good' | 'bad' | 'neutral' = 'neutral';
			if (randomPlayer.difficulty === 'bad') type = 'bad';
			else if (randomPlayer.difficulty === 'good') type = 'good';

			const scenario = activeGameData.scenarios.find(s => s.id === randomPlayer.currentScenarioId);
			let templates = activeGameData.newsTemplates[type];
			
			if (scenario?.news?.[type] && scenario.news[type].length > 0) {
				templates = scenario.news[type];
			}

			const template = templates[Math.floor(Math.random() * templates.length)];
			const text = template.replace('{continent}', continent);
			newItems.push(text);
		}

		newsItems = [...newsItems, ...newItems];
		if (newsItems.length > 20) {
			newsItems = newsItems.slice(newsItems.length - 20);
		}
	}

	$effect(() => {
		if (status !== 'active') {
			if (newsItems.length > 0) newsItems = [];
		}
	});

	const players = $derived.by((): [string, PlayerData][] => {
		if (!localSession?.players) return [];
		return Object.entries(localSession.players) as [string, PlayerData][];
	});
	const activePlayers = $derived(players.filter(([_, p]) => isPlayerActive(p)));
	const status = $derived(localSession?.status ?? 'waiting');
	const round = $derived(localSession?.round ?? 1);
	const allReady = $derived.by(() => {
		if (activePlayers.length === 0) return false;
		return activePlayers.every(([_, p]) => p.readyToRestart);
	});

	function startTimer() {
		stopTimer();
		timeLeft = activeGameData.config.timerSeconds;
		// Sync initial value
		updateSessionTimer(teacherUid, sessionCode, timeLeft).catch(() => {});

		timerInterval = setInterval(() => {
			timeLeft--;
			updateSessionTimer(teacherUid, sessionCode, timeLeft).catch(() => {});
			if (timeLeft <= 0) {
				handleTimeUp();
			}
		}, 1000);
	}

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	async function handleTimeUp() {
		stopTimer();
		if (!localSession || isProcessing) return;
		isProcessing = true;
		try {
			await calculateResults(teacherUid, sessionCode, localSession);
		} catch (e: any) {
			emitError('Failed to calculate results.');
		} finally {
			isProcessing = false;
		}
	}

	onMount(() => {
		if (sessionCode && teacherUid) {
			unsubscribe = onSessionUpdate(teacherUid, sessionCode, (data) => {
				if (!data) {
					emitNotification('Session has been deleted.');
					goto(`/teacher/commandCenter/${teacherUid}`);
					return;
				}

				localSession = data;

				if (data.status === 'active') {
					// Start timer only for new rounds
					if (data.round !== lastSyncedRound) {
						lastSyncedRound = data.round;
						startTimer();
						playSound('ambiance');
						generateNews(6);
					}

					// Check if all active players have submitted
					if (allPlayersSubmitted(data.players || {})) {
						handleTimeUp();
					}
				} else {
					stopTimer();
				}
			});
		}
	});

	onDestroy(() => {
		stopTimer();
		stopSessionSync(unsubscribe);
	});

	async function handleStartMission() {
		if (!localSession || isProcessing) return;
		isProcessing = true;
		try {
			await startMission(teacherUid, sessionCode, localSession);
			playSound('ambiance');
		} catch (e: any) {
			emitError(e.message || 'Failed to start mission.');
		} finally {
			isProcessing = false;
		}
	}

	async function handleCancel() {
		if (isProcessing) return;
		isProcessing = true;
		try {
			await cancelSession(teacherUid, sessionCode);
			goto(`/teacher/commandCenter/${teacherUid}`);
		} catch (e: any) {
			emitError(e.message || 'Failed to cancel session.');
		} finally {
			isProcessing = false;
		}
	}

	async function handleNextRound() {
		if (!localSession || isProcessing) return;
		isProcessing = true;
		try {
			await advanceFromResults(teacherUid, sessionCode, localSession);
		} catch (e: any) {
			emitError(e.message || 'Failed to advance round.');
		} finally {
			isProcessing = false;
		}
	}

	async function handleRestart() {
		if (!localSession || isProcessing) return;
		isProcessing = true;
		try {
			await teacherRestart(teacherUid, sessionCode, localSession);
		} catch (e: any) {
			emitError(e.message || 'Failed to restart session.');
		} finally {
			isProcessing = false;
		}
	}
</script>

<div class="session-view-page">
	<!-- Header -->
	<GlitchyTitle level={3}>Mission: {sessionCode}</GlitchyTitle>
	<div class="status-bar">
		<span class="status-chip" data-status={status}>{status.toUpperCase()}</span>
		<span class="round-chip">ROUND {round}/{activeGameData.config.maxRounds}</span>
		{#if status === 'active'}
			<span class="timer-chip" class:urgent={timeLeft <= 15}>{timeLeft}s</span>
		{/if}
	</div>

	{#if status === 'waiting'}
		<!-- ────────── LOBBY STATE ────────── -->
		<section class="session-section">
			<div class="mission-code-card">
				<p class="code-label">MISSION CODE</p>
				<h2 class="code-value">{sessionCode}</h2>
				<p class="code-status">WAITING FOR LEADERS | {activePlayers.length}/6 CONNECTED</p>
			</div>

			<div class="player-grid">
				{#each players as [pUid, player]}
					<PlayerCard
						name={player.name}
						score={player.score}
						continent={player.continent ?? ''}
						statusLed={isPlayerActive(player) ? 'green' : 'orange'}
						statusLabel={isPlayerActive(player) ? 'ONLINE' : 'OFFLINE'}
					/>
				{:else}
					<p class="empty">
						Waiting for students to join with code <strong>{sessionCode}</strong>...
					</p>
				{/each}
			</div>

			<ButtonGroup>
				<RetroButton danger onclick={handleCancel} disabled={isProcessing}>
					<Ban /> Cancel
				</RetroButton>
				<RetroButton
					onclick={handleStartMission}
					disabled={activePlayers.length === 0 || isProcessing}
				>
					<Rocket /> Start Mission
				</RetroButton>
			</ButtonGroup>
		</section>
	{:else if status === 'active'}
		<!-- ────────── ACTIVE GAME STATE ────────── -->
		<section class="session-section">
			<h3>Round {round} — In Progress</h3>

			<div class="player-grid">
				{#each activePlayers as [pUid, player]}
					{@const pStatusLed = player.submitted ? 'green' : 'orange'}
					<PlayerCard
						name={player.name}
						score={player.score}
						continent={player.continent ?? ''}
						statusLed={pStatusLed}
					/>
				{/each}
			</div>

			{#if isProcessing}
				<LoadingBar message="Calculating results..." />
			{/if}
		</section>

		<NewsTicker {newsItems} />
	{:else if status === 'results'}
		<!-- ────────── RESULTS STATE ────────── -->
		<section class="session-section">
			<h3>Round {round} Analysis</h3>

			<div class="player-grid">
				{#each activePlayers as [pUid, player]}
					{@const latestScore =
						player.history && player.history.length > 0
							? player.history[player.history.length - 1].score
							: 0}
					{@const rating = getRoundRating(latestScore)}
					<div class="result-card">
						<PlayerCard
							name={player.name}
							score={player.score}
							continent={player.continent ?? ''}
						/>
						<div class="result-detail">
							<span class="result-score" style="color: {rating.color}">
								+{latestScore} pts ({rating.label})
							</span>
						</div>
					</div>
				{/each}
			</div>

			<ButtonGroup>
				<RetroButton onclick={handleNextRound} disabled={isProcessing}>
					<SkipForward />
					{round >= GAME_DATA.config.maxRounds ? 'Finish Mission' : 'Next Round'}
				</RetroButton>
			</ButtonGroup>
		</section>
	{:else if status === 'finished'}
		<!-- ────────── FINISHED STATE ────────── -->
		<section class="session-section">
			<h3>Mission Complete</h3>

			<div class="player-outcomes-grid">
				{#each [...activePlayers].sort((a, b) => b[1].score - a[1].score) as [pUid, player], index}
					{@const civ = getCivilizationStatus(player.score, GAME_DATA.config.maxRounds)}
					{@const rankClass =
						index === 0
							? 'rank-gold'
							: index === 1
								? 'rank-silver'
								: index === 2
									? 'rank-bronze'
									: ''}
					<div class="leaderboard-item">
						<div class="leaderboard-rank {rankClass}">{index + 1}</div>
						<PlayerCard
							name={player.name}
							score={player.score}
							continent={player.continent ?? ''}
							statusLabel={civ.title}
							statusLed={player.readyToRestart ? 'green' : 'orange'}
						/>
					</div>
				{/each}
			</div>

			<ButtonGroup>
				<RetroButton onclick={handleRestart} disabled={!allReady || isProcessing}>
					<RotateCcw />
					Restart Systems
				</RetroButton>
				<RetroButton danger onclick={handleCancel} disabled={isProcessing}>
					<Ban /> Cancel Mission
				</RetroButton>
			</ButtonGroup>
		</section>
	{/if}
</div>

<style>
	.session-view-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 3rem 2rem;
		max-width: 1000px;
		margin: 0 auto;
	}
	@media (max-width: 600px) {
		.session-view-page {
			padding: 2rem 1rem;
		}
	}

	.status-bar {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
	}
	.status-chip {
		padding: 0.3rem 0.8rem;
		border-radius: var(--border-radius-pill);
		font-family: var(--font-head);
		font-size: 0.8rem;
		letter-spacing: 2px;
		border: 1px solid var(--teal);
		background: var(--muted-teal);
	}
	.status-chip[data-status='active'] {
		border-color: var(--orange);
		background: var(--muted-orange);
		color: var(--orange);
	}
	.status-chip[data-status='results'] {
		border-color: var(--blue);
		background: var(--muted-blue);
	}
	.status-chip[data-status='finished'] {
		border-color: var(--green);
		background: var(--muted-green);
		color: var(--green);
	}
	.round-chip {
		padding: 0.3rem 0.8rem;
		border-radius: var(--border-radius-pill);
		font-family: var(--font-code);
		font-size: 0.8rem;
		border: 1px solid var(--blue);
		background: var(--muted-blue);
	}
	.timer-chip {
		padding: 0.3rem 0.8rem;
		border-radius: var(--border-radius-pill);
		font-family: var(--font-head);
		font-size: 0.9rem;
		font-weight: 900;
		border: 1px solid var(--teal);
		background: var(--muted-teal);
	}
	.timer-chip.urgent {
		border-color: var(--error-color);
		background: var(--muted-error-color);
		color: var(--error-color);
		animation: pulse 0.5s infinite;
	}

	.session-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}
	.session-section h3 {
		font-family: var(--font-head);
		font-size: 1.3rem;
		letter-spacing: 2px;
	}

	.mission-code-card {
		text-align: center;
		padding: 2rem 4rem;
		border: 2px solid var(--teal);
		border-radius: 4px;
		background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(249, 115, 22, 0.05));
		position: relative;
		overflow: hidden;
		width: 100%;
		max-width: 500px;
	}
	.mission-code-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.5), transparent);
		animation: scanner 5s infinite linear;
	}
	.code-label {
		font-family: var(--font-head);
		font-size: 0.8rem;
		letter-spacing: 3px;
		opacity: 0.7;
	}
	.code-value {
		font-family: var(--font-head);
		font-size: 3.5rem;
		font-weight: 900;
		text-shadow: var(--chromatic-text);
		letter-spacing: 8px;
	}
	.code-status {
		font-family: var(--font-code);
		font-size: 0.85rem;
		opacity: 0.7;
		margin-top: 0.5rem;
	}

	.player-grid {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}
	.empty {
		opacity: 0.5;
		font-style: italic;
		grid-column: 1 / -1;
		text-align: center;
	}

	.result-card,
	.final-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem;
		border: 1px solid var(--blue);
		border-radius: var(--border-radius-2);
		background: var(--muted-blue);
	}
	.result-detail {
		padding-top: 0.25rem;
	}
	.result-score {
		font-family: var(--font-head);
		font-size: 0.85rem;
		font-weight: 700;
	}

	.final-card {
		border-color: var(--civ-color, var(--blue));
	}
	.ready-indicator {
		font-family: var(--font-code);
		font-size: 0.85rem;
		opacity: 0.7;
	}

	.player-outcomes-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 600px;
		margin: 1.5rem auto 0;
	}
	.leaderboard-item {
		position: relative;
		padding-left: 5.5rem;
	}
	.leaderboard-rank {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 1.8rem;
		font-weight: 900;
		font-family: var(--font-head);
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.4);
		border: 2px solid var(--muted-teal);
		border-radius: 50%;
		color: var(--teal);
		text-shadow: 0 0 10px var(--teal);
	}
	.leaderboard-rank.rank-gold {
		border-color: var(--gold);
		color: var(--gold);
		text-shadow: 0 0 15px var(--gold);
	}
	.leaderboard-rank.rank-silver {
		border-color: var(--silver);
		color: var(--silver);
		text-shadow: 0 0 15px var(--silver);
	}
	.leaderboard-rank.rank-bronze {
		border-color: var(--bronze);
		color: var(--bronze);
		text-shadow: 0 0 15px var(--bronze);
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
