<script lang="ts">
	import { base } from '$app/paths';
	import GlitchyTitle from '$lib/components/GlitchyTitle.svelte';
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import RetroButton from '$lib/components/RetroButton.svelte';
	import ButtonGroup from '$lib/components/ButtonGroup.svelte';
	import LoadingBar from '$lib/components/LoadingBar.svelte';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { uid, sessionCode, hostUid, sessionData, resetGameStore } from '$lib/stores/game.store';
	import type { SessionData, PlayerData } from '$lib/stores/game.store';
	import { onSessionUpdate, stopSessionSync, leaveSession } from '$lib/services/realtimeDB.service';
	import { emitError } from '$lib/stores/snackbar.store';
	import type { Unsubscribe } from 'firebase/database';
	import { get } from 'svelte/store';

	let unsubscribe: Unsubscribe | null = null;
	let localSession = $state<SessionData | null>(null);

	const players = $derived.by((): [string, PlayerData][] => {
		if (!localSession?.players) return [];
		return Object.entries(localSession.players) as [string, PlayerData][];
	});

	onMount(() => {
		const code = get(sessionCode);
		const host = get(hostUid);

		if (!code || !host) {
			goto(`${base}/student`);
			return;
		}

		unsubscribe = onSessionUpdate(host, code, (data) => {
			if (!data) {
				// Session was deleted
				emitError('The session was ended by the teacher.');
				resetGameStore();
				goto(`${base}/student`);
				return;
			}

			localSession = data;
			sessionData.set(data);

			const myUid = get(uid);

			// Navigate based on session status
			if (data.status === 'active') {
				const player = data.players?.[myUid!];
				if (player && !player.isWaiting) {
					goto(`${base}/student/game`);
				}
			} else if (data.status === 'results') {
				goto(`${base}/student/results`);
			} else if (data.status === 'finished') {
				goto(`${base}/student/end`);
			}
		});
	});

	onDestroy(() => {
		stopSessionSync(unsubscribe);
	});

	async function handleLeave() {
		try {
			const myUid = get(uid);
			const host = get(hostUid);
			const code = get(sessionCode);
			if (myUid && host && code) {
				await leaveSession(host, code, myUid);
			}
			sessionStorage.removeItem('climateCivSessionCode');
			sessionStorage.removeItem('climateCivHostUid');
			localStorage.removeItem('climateCivSessionCode');
			localStorage.removeItem('climateCivHostUid');
			resetGameStore();
			goto(`${base}/student`);
		} catch (e: any) {
			emitError(e.message || 'Failed to leave session.');
		}
	}
</script>

<div class="student-lobby-page">
	<GlitchyTitle level={2}>Preparing Mission</GlitchyTitle>
	<p class="subtitle">You are connected! Waiting for the teacher to start the mission.</p>

	<div class="lobby-container">
		<h3>CONNECTED LEADERS: <span class="count">{players.length}/6</span></h3>
		<div class="player-grid">
			{#each players as [pUid, player]}
				<PlayerCard name={player.name} score={player.score} continent={player.continent ?? ''} />
			{:else}
				<p class="empty">No leaders connected yet...</p>
			{/each}
		</div>
	</div>

	<ButtonGroup>
		<RetroButton secondary onclick={handleLeave}>
			<LogOut /> Leave Session
		</RetroButton>
	</ButtonGroup>
</div>

<style>
	.student-lobby-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 4rem 2rem;
		max-width: 1440px;
		margin: 0 auto;
	}
	@media (max-width: 600px) {
		.student-lobby-page {
			padding: 2rem 1rem;
		}
	}
	.subtitle {
		opacity: 0.8;
		font-size: 1.2rem;
	}
	.lobby-container {
		width: 100%;
		max-width: 700px;
		padding: 1.5rem;
		border: 1px solid var(--teal);
		border-radius: var(--border-radius-2);
		background: var(--muted-teal);
	}
	.lobby-container h3 {
		font-family: var(--font-head);
		margin-bottom: 1rem;
	}
	.count {
		color: var(--orange);
	}
	.player-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.empty {
		opacity: 0.5;
		font-style: italic;
	}
</style>
