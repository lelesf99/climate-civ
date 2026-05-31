<script lang="ts">
	import GlitchyTitle from '$lib/components/GlitchyTitle.svelte';
	import ResourceSlider from '$lib/components/ResourceSlider.svelte';
	import RetroButton from '$lib/components/RetroButton.svelte';
	import TerminalAnimation from '$lib/components/TerminalAnimation.svelte';
	import LoadingBar from '$lib/components/LoadingBar.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { uid, sessionCode, hostUid, sessionData, resetGameStore } from '$lib/stores/game.store';
	import type { SessionData } from '$lib/stores/game.store';
	import { GAME_DATA } from '$lib/data/gameData';
	import type { Scenario } from '$lib/data/gameData';
	import {
		onSessionUpdate,
		stopSessionSync,
		submitAllocation
	} from '$lib/services/realtimeDB.service';
	import { playSound } from '$lib/services/audio.service';
	import { emitError } from '$lib/stores/snackbar.store';
	import type { Unsubscribe } from 'firebase/database';

	let unsubscribe: Unsubscribe | null = null;
	let isWaiting = $state(false);
	let hasSubmitted = $state(false);
	let scenario = $state<Scenario | null>(null);
	let timeLeft = $derived($sessionData?.timer ?? 90);

	let sliders = $state<Array<{ id: string; name: string; value: number; ideal: number }>>([]);

	const totalAllocated = $derived(sliders.reduce((sum, s) => sum + s.value, 0));
	const maxRes = $derived($sessionData?.customGameData?.config?.maxResources ?? GAME_DATA.config.maxResources);
	const remaining = $derived(maxRes - totalAllocated);

	function balanceSliders(changedId: string, newValue: number) {
		// Update the changed slider value first
		const changedIndex = sliders.findIndex(s => s.id === changedId);
		if (changedIndex === -1) return;
		sliders[changedIndex].value = newValue;

		const total = sliders.reduce((sum, s) => sum + s.value, 0);

		if (total > maxRes) {
			const others = sliders.filter(s => s.id !== changedId);
			const othersTotal = others.reduce((sum, s) => sum + s.value, 0);
			const remainingPool = maxRes - newValue;

			if (othersTotal > 0) {
				const items = others.map(s => {
					const exact = (s.value / othersTotal) * remainingPool;
					return {
						slider: s,
						floorValue: Math.floor(exact),
						fraction: exact - Math.floor(exact)
					};
				});

				// Assign floor values
				items.forEach(item => {
					item.slider.value = item.floorValue;
				});

				// Distribute remainder (if any) based on fractional parts to make total exactly maxRes
				const currentTotal = newValue + items.reduce((sum, item) => sum + item.floorValue, 0);
				const remainder = maxRes - currentTotal;

				if (remainder > 0) {
					items.sort((a, b) => b.fraction - a.fraction);
					for (let i = 0; i < remainder; i++) {
						items[i].slider.value = items[i].slider.value + 1;
					}
				}
			} else if (others.length > 0) {
				others[0].value = maxRes - newValue;
			}
		}
	}

	function loadScenario(scenarioId: string | null | undefined) {
		if (!scenarioId) return;
		const activeGameData = $sessionData?.customGameData || GAME_DATA;
		let found = activeGameData.scenarios.find((s) => s.id === scenarioId);
		if (!found) {
			found = GAME_DATA.scenarios.find((s) => s.id === scenarioId);
		}
		if (!found || found.id === scenario?.id) return;

		scenario = found;
		sliders = found.initiatives.map((init) => ({
			id: init.id,
			name: init.name,
			value: 0,
			ideal: init.ideal
		}));
		isWaiting = false;
		hasSubmitted = false;
	}

	async function handleSubmit() {
		if (hasSubmitted) return;
		hasSubmitted = true;

		const host = get(hostUid);
		const code = get(sessionCode);
		const myUid = get(uid);
		if (!host || !code || !myUid) return;

		const resources: Record<string, number> = {};
		for (const s of sliders) {
			resources[s.id] = s.value;
		}

		try {
			playSound('confirm');
			await submitAllocation(host, code, myUid, resources, timeLeft);
			isWaiting = true;
		} catch (e: any) {
			emitError(e.message || 'Failed to submit allocation.');
			hasSubmitted = false;
		}
	}

	async function handleAutoSubmit() {
		if (hasSubmitted) return;
		// Auto-submit whatever they have
		await handleSubmit();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.code === 'Space' && !isWaiting && !hasSubmitted) {
			e.preventDefault();
			handleSubmit();
		}
	}

	onMount(() => {
		const code = get(sessionCode);
		const host = get(hostUid);
		const myUid = get(uid);

		if (!code || !host || !myUid) {
			goto('/student');
			return;
		}

		document.addEventListener('keydown', handleKeydown);

		unsubscribe = onSessionUpdate(host, code, (data) => {
			if (!data) {
				emitError('The session was ended by the teacher.');
				resetGameStore();
				goto('/student');
				return;
			}

			sessionData.set(data);
			const player = data.players?.[myUid];
			if (!player) return;

			if (data.status === 'active') {
				if (player.submitted) {
					isWaiting = true;
					hasSubmitted = true;
				} else {
					loadScenario(player.currentScenarioId);
					// Auto submit if the synchronized timer runs out on the server
					if (data.timer <= 0) {
						handleAutoSubmit();
					}
				}
			} else if (data.status === 'results') {
				goto('/student/results');
			} else if (data.status === 'finished') {
				goto('/student/end');
			} else if (data.status === 'waiting') {
				goto('/student/lobby');
			}
		});

		playSound('ambiance');
	});

	onDestroy(() => {
		stopSessionSync(unsubscribe);
		if (typeof document !== 'undefined') {
			document.removeEventListener('keydown', handleKeydown);
		}
	});
</script>

<div class="student-game-page">
	{#if isWaiting}
		<div class="wait-container">
			<GlitchyTitle level={3}>Decision Sent</GlitchyTitle>
			<p class="wait-text">Waiting for other leaders...</p>
			<TerminalAnimation />
		</div>
	{:else if scenario}
		<div class="player-hud">
			<div class="timer" class:urgent={timeLeft <= 15}>
				<span class="timer-value">{timeLeft}</span>
				<span class="timer-label">SECONDS</span>
			</div>

			<div class="scenario-section">
				<div class="scenario-brief">
					<GlitchyTitle level={4} sub>ROUND BRIEFING</GlitchyTitle>
					<p class="scenario-text">{scenario.text}</p>
				</div>

				<div class="resource-pool" class:over={remaining < 0}>
					AVAILABLE RESOURCES: <span class="resource-count">{remaining}</span>
				</div>

				<div class="sliders-container">
					{#each sliders as slider, i}
						<ResourceSlider
							id={slider.id}
							name={slider.name}
							value={slider.value}
							onchange={(newVal) => balanceSliders(slider.id, newVal)}
							max={maxRes}
						/>
					{/each}
				</div>
			</div>

			<div class="submit-section">
				<button
					class="big-red-btn"
					onclick={handleSubmit}
					disabled={remaining < 0 || hasSubmitted}
				>
					<span class="btn-icon">●</span>
				</button>
				<div class="btn-label">
					CONFIRM DECISION <span class="key-hint">SPACE</span>
				</div>
			</div>
		</div>
	{:else}
		<LoadingBar message="Loading scenario..." />
	{/if}
</div>

<style>
	/* Legacy: player.css layout */
	.student-game-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		max-width: 900px;
		margin: 0 auto;
		min-height: 100vh;
	}

	.wait-container {
		grid-column: span 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 100%;
		max-width: 800px;
		margin: 2rem auto;
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid var(--muted-blue);
		border-radius: 8px;
		padding: 1.5rem;
		box-sizing: border-box;
	}
	.wait-text {
		font-size: 1.1rem;
		color: var(--text-color);
		opacity: 0.7;
		font-style: italic;
		animation: pulse 2s infinite;
	}

	/* Legacy: .player-hud — grid layout */
	.player-hud {
		display: grid;
		grid-template-columns: 2fr 1fr;
		justify-content: center;
		gap: 1rem;
		width: 100%;
	}

	/* Legacy: #player-timer-display */
	.timer {
		text-align: center;
		grid-column: span 2;
	}
	.timer-value {
		font-size: 4rem;
		font-family: var(--font-head);
		font-weight: 700;
	}
	.timer.urgent .timer-value {
		color: var(--error-color);
		animation: pulse 0.5s infinite;
	}
	.timer-label {
		font-family: var(--font-code);
		font-size: 0.8rem;
		opacity: 0.6;
	}

	/* Legacy: #resource-allocation-container */
	.scenario-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.scenario-brief {
		padding: 1rem;
	}
	/* Legacy: #player-scenario-brief */
	.scenario-text {
		font-size: xx-large;
		letter-spacing: 1px;
		font-weight: 700;
	}

	/* Legacy: #resource-pool */
	.resource-pool {
		font-size: 1.5rem;
		color: var(--teal);
		text-align: center;
		border: 2px dashed var(--teal);
		padding: 1rem;
		border-radius: 4px;
	}
	.resource-pool.over {
		border-color: var(--error-color);
		color: var(--error-color);
	}
	.resource-count {
		font-weight: bold;
		font-size: 1.8rem;
		font-family: var(--font-head);
	}

	/* Legacy: #sliders-container */
	.sliders-container {
		border-radius: 1rem;
		overflow: hidden;
	}
	.sliders-container :global(.resource-slider:nth-child(odd)) {
		background-color: var(--bg-blue);
	}

	/* Legacy: #presidential-btn-container */
	.submit-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		width: fit-content;
		margin: 0 auto;
	}

	@media (max-width: 768px) {
		.player-hud {
			grid-template-columns: 1fr;
		}
		.timer {
			grid-column: 1;
		}
		.submit-section {
			margin-top: 2rem;
		}
	}

	/* Legacy: .big-red-btn from ui.css */
	.big-red-btn {
		width: 200px;
		height: 200px;
		border-radius: 50%;
		background: radial-gradient(circle at 30% 30%, #ef4444, #991b1b);
		border: 8px solid #7f1d1d;
		box-shadow:
			0 0 30px rgba(239, 68, 68, 0.6),
			0 10px 40px rgba(0, 0, 0, 0.8),
			inset 0 -10px 30px rgba(0, 0, 0, 0.5),
			inset 0 10px 30px rgba(255, 100, 100, 0.3);
		cursor: pointer;
		transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-head);
	}
	.big-red-btn .btn-icon {
		position: absolute;
		top: 15%;
		left: 20%;
		transform: translate(-50%, -50%);
		font-size: 4rem;
		color: rgba(255, 255, 255, 0.95);
		text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
		animation: pulse-glow 2s infinite;
	}
	.big-red-btn:hover:not(:disabled) {
		background: radial-gradient(circle at 30% 30%, #f87171, #b91c1c);
		box-shadow:
			0 0 60px rgba(239, 68, 68, 1),
			0 10px 50px rgba(239, 68, 68, 0.5),
			inset 0 -10px 30px rgba(0, 0, 0, 0.5),
			inset 0 10px 30px rgba(255, 120, 120, 0.4);
		transform: translateY(-3px) scale(1.05);
	}
	.big-red-btn:active:not(:disabled) {
		transform: translateY(5px) scale(0.95);
		box-shadow:
			0 0 40px rgba(239, 68, 68, 0.8),
			0 5px 20px rgba(0, 0, 0, 0.8),
			inset 0 5px 20px rgba(0, 0, 0, 0.7);
	}
	.big-red-btn:disabled {
		background: radial-gradient(circle at 30% 30%, #450a0a, #1f0404);
		border-color: #1f0404;
		opacity: 0.5;
		cursor: not-allowed;
		box-shadow:
			0 0 10px rgba(127, 29, 29, 0.3),
			inset 0 5px 20px rgba(0, 0, 0, 0.8);
		transform: none;
	}
	.big-red-btn:disabled .btn-icon {
		opacity: 0.4;
		animation: none;
	}

	/* Legacy: .btn-label & .key-hint from ui.css */
	.btn-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
	}
	.key-hint {
		border: 1px solid var(--muted-teal);
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-size: 0.9rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: var(--teal);
	}
</style>
