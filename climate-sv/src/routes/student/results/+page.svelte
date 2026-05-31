<script lang="ts">
	import { base } from '$app/paths';
	import GlitchyTitle from '$lib/components/GlitchyTitle.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { uid, sessionCode, hostUid, sessionData, resetGameStore } from '$lib/stores/game.store';
	import type { SessionData, HistoryItem } from '$lib/stores/game.store';
	import {
		onSessionUpdate,
		stopSessionSync
	} from '$lib/services/realtimeDB.service';
	import { getRoundRating } from '$lib/services/game.service';
	import { emitError } from '$lib/stores/snackbar.store';
	import type { Unsubscribe } from 'firebase/database';

	let unsubscribe: Unsubscribe | null = null;
	let localSession = $state<SessionData | null>(null);

	const myUid = get(uid);
	const player = $derived(localSession?.players?.[myUid!]);
	const round = $derived(localSession?.round ?? 1);
	const latestHistory = $derived.by((): HistoryItem | null => {
		const hist = player?.history;
		if (!hist || hist.length === 0) return null;
		return hist[hist.length - 1];
	});
	const roundScore = $derived(latestHistory?.score ?? 0);
	const totalScore = $derived(player?.score ?? 0);
	const rating = $derived(getRoundRating(roundScore));

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

			if (data.status === 'active') {
				goto(`${base}/student/game`);
			} else if (data.status === 'finished') {
				goto(`${base}/student/end`);
			} else if (data.status === 'waiting') {
				goto(`${base}/student/lobby`);
			}
		});
	});

	onDestroy(() => {
		stopSessionSync(unsubscribe);
	});
</script>

<div class="student-results-page">
	<GlitchyTitle level={2}>Round {round} Results</GlitchyTitle>

	<div class="results-container">
		<div class="score-display">
			<span class="score-label">TOTAL SCORE</span>
			<span class="score-value">{totalScore}</span>
		</div>

		<div class="rating-badge" style="--rating-color: {rating.color}">
			<span class="rating-label">{rating.label}</span>
			<p><strong>{roundScore}</strong> points this round.</p>
		</div>

		{#if latestHistory}
			<div class="initiative-breakdown">
				<h3>DECISION ANALYSIS</h3>
				{#each latestHistory.initiatives as init}
					{@const playerVal = latestHistory.resources?.[init.id] ?? 0}
					{@const deviation = Math.abs(playerVal - init.ideal)}
					{@const accuracy = deviation <= 5 ? 'perfect' : deviation <= 15 ? 'close' : 'off'}
					<div class="init-row" data-accuracy={accuracy}>
						<span class="init-name">{init.name}</span>
						<div class="init-values">
							<span class="yours">{playerVal}%</span>
							<span class="vs">→</span>
							<span class="ideal">{init.ideal}%</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<p class="waiting-text">Waiting for next round...</p>
	</div>
</div>

<style>
	/* Legacy: player.css — round results */
	.student-results-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 4rem 2rem;
		max-width: 800px;
		margin: 0 auto;
	}
	@media (max-width: 600px) {
		.student-results-page {
			padding: 2rem 1rem;
		}
	}

	/* Legacy: .player-feedback */
	.results-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		max-width: 600px;
		margin: 0 auto;
		padding: 1rem;
		width: 100%;
	}

	/* Legacy: .round-score-display */
	.score-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}
	/* Legacy: .score-label */
	.score-label {
		font-size: 0.9rem;
		color: var(--teal);
		letter-spacing: 3px;
		text-transform: uppercase;
	}
	/* Legacy: .score-value */
	.score-value {
		font-size: 4rem;
		font-weight: 900;
		color: var(--text-color);
		font-family: var(--font-head);
		text-shadow: var(--chromatic-text);
	}

	/* Legacy: .feedback-message */
	.rating-badge {
		padding: 1rem;
		border: 2px solid var(--rating-color);
		border-radius: 8px;
		text-align: center;
		width: 100%;
		background: color-mix(in srgb, var(--rating-color) 10%, transparent);
	}
	.rating-label {
		font-size: 1.5rem;
		font-weight: bold;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--rating-color);
	}

	/* Legacy: .initiative-breakdown */
	.initiative-breakdown {
		width: 100%;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid var(--muted-teal);
		border-radius: 8px;
		padding: 1.5rem;
	}
	.initiative-breakdown h3 {
		font-size: 0.9rem;
		color: var(--teal);
		letter-spacing: 2px;
		text-transform: uppercase;
		margin-bottom: 1rem;
		text-align: center;
	}

	/* Legacy: .initiative-item */
	.init-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.8rem;
		margin-bottom: 0.5rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 4px;
		border-left: 3px solid transparent;
	}
	.init-row[data-accuracy='perfect'] {
		border-left-color: var(--green);
	}
	.init-row[data-accuracy='close'] {
		border-left-color: var(--orange);
	}
	.init-row[data-accuracy='off'] {
		border-left-color: var(--error-color);
	}

	/* Legacy: .initiative-name */
	.init-name {
		font-size: 0.9rem;
		color: var(--text-color);
		flex: 1;
	}
	.init-values {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-code);
		font-size: 0.9rem;
		min-width: 120px;
		justify-content: flex-end;
	}
	.yours {
		font-weight: 700;
	}
	.vs {
		opacity: 0.4;
	}
	.ideal {
		opacity: 0.6;
	}

	/* Legacy: .waiting-text */
	.waiting-text {
		font-size: 1.1rem;
		color: var(--text-color);
		opacity: 0.7;
		font-style: italic;
		animation: pulse 2s infinite;
	}
</style>
