<script lang="ts">
	import { base } from '$app/paths';
	import GlitchyTitle from '$lib/components/GlitchyTitle.svelte';
	import RetroButton from '$lib/components/RetroButton.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { uid, sessionCode, hostUid, sessionData, resetGameStore } from '$lib/stores/game.store';
	import type { SessionData, HistoryItem } from '$lib/stores/game.store';
	import {
		onSessionUpdate,
		stopSessionSync,
		signalRestartReady
	} from '$lib/services/realtimeDB.service';
	import { getCivilizationStatus } from '$lib/services/game.service';
	import { GAME_DATA } from '$lib/data/gameData';
	import { emitError } from '$lib/stores/snackbar.store';
	import type { Unsubscribe } from 'firebase/database';

	let unsubscribe: Unsubscribe | null = null;
	let localSession = $state<SessionData | null>(null);

	const myUid = get(uid);
	const player = $derived(localSession?.players?.[myUid!]);
	const finalScore = $derived(player?.score ?? 0);
	const history = $derived(player?.history ?? []);
	const isReady = $derived(player?.readyToRestart ?? false);
	const civStatus = $derived(
		getCivilizationStatus(finalScore, GAME_DATA.config.maxRounds)
	);

	async function toggleReady() {
		const host = get(hostUid);
		const code = get(sessionCode);
		if (!host || !code || !myUid) return;
		try {
			await signalRestartReady(host, code, myUid, !isReady);
		} catch (e: any) {
			emitError(e.message || 'Failed to signal ready.');
		}
	}

	onMount(() => {
		const code = get(sessionCode);
		const host = get(hostUid);

		if (!code || !host) {
			goto(`${base}/student`);
			return;
		}

		unsubscribe = onSessionUpdate(host, code, (data) => {
			if (!data) {
				emitError('The session was ended by the teacher.');
				resetGameStore();
				goto(`${base}/student`);
				return;
			}

			localSession = data;
			sessionData.set(data);

			// If the session resets to waiting, go back to lobby
			if (data.status === 'waiting') {
				goto(`${base}/student/lobby`);
			} else if (data.status === 'active') {
				goto(`${base}/student/game`);
			}
		});
	});

	onDestroy(() => {
		stopSessionSync(unsubscribe);
	});
</script>

<div class="student-end-page">
	<GlitchyTitle level={2}>Mission Complete</GlitchyTitle>

	<div class="status-banner" style="--status-color: {civStatus.color}">
		<h2 class="status-title">{civStatus.title}</h2>
		<div class="final-score">
			<span class="score-number">{finalScore}</span>
			<small>TOTAL POINTS</small>
		</div>
	</div>

	{#if history.length > 0}
		<div class="history-section">
			<h3>YOUR JOURNEY</h3>
			{#each history as item, i}
				<div class="history-item">
					<div class="history-header">
						<span class="round-label">ROUND {i + 1}</span>
						<span class="round-score">{item.score} pts</span>
					</div>
					<p class="scenario-text">{item.scenarioText}</p>
				</div>
			{/each}
		</div>
	{/if}

	<RetroButton onclick={toggleReady}>
		{#if isReady}
			✓ READY — WAITING FOR OTHERS
		{:else}
			READY FOR NEW MISSION
		{/if}
	</RetroButton>
</div>

<style>
	/* Legacy: player.css — end screen */
	.student-end-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		padding: 4rem 2rem;
		max-width: 800px;
		margin: 0 auto;
	}
	@media (max-width: 600px) {
		.student-end-page {
			padding: 2rem 1rem;
		}
	}

	/* Legacy: #player-score-banner */
	.status-banner {
		width: 100%;
		text-align: center;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		animation: fadeIn 0.8s ease-out;
	}

	/* Legacy: .outcome-title */
	.status-title {
		font-family: var(--font-head);
		font-size: 2.2rem;
		letter-spacing: 4px;
		text-transform: uppercase;
		margin-bottom: 0.5rem;
		color: var(--status-color);
		text-shadow: 0 0 15px currentColor;
	}

	.final-score {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* Legacy: .final-score-large */
	.score-number {
		font-size: 5rem;
		font-weight: 900;
		font-family: var(--font-head);
		line-height: 1;
		color: var(--text-color);
		text-shadow: var(--chromatic-text);
	}
	.final-score small {
		display: block;
		font-size: 1rem;
		letter-spacing: 3px;
		opacity: 0.7;
		margin-top: 0.5rem;
	}

	/* Legacy: #scenario-history */
	.history-section {
		width: 100%;
		max-height: 50vh;
		overflow-y: auto;
		padding-right: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.history-section h3 {
		font-family: var(--font-head);
		font-size: 1rem;
		letter-spacing: 3px;
		margin-bottom: 0.5rem;
	}
	.history-item {
		padding: 1rem;
		border: 1px solid var(--blue);
		border-radius: 8px;
		background: var(--muted-blue);
	}
	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	.round-label {
		font-family: var(--font-head);
		font-size: 0.9rem;
		color: var(--teal);
	}
	.round-score {
		font-family: var(--font-head);
		font-weight: 900;
		color: var(--orange);
	}
	.scenario-text {
		font-size: 0.95rem;
		line-height: 1.5;
		opacity: 0.8;
	}
</style>
