<script lang="ts">
	import { onMount } from 'svelte';

	const logs = [
		'[OK] Validating resource allocation (Σ == 100)...',
		'[SYSTEM] Serializing player state to JSON data packet...',
		'[LOCAL] Writing decision to localStorage fallback...',
		'[FIRESTORE] Handshaking with session document...',
		'[FIRESTORE] Pushing update to player node...',
		'[NETWORK] Syncing assets: climate-data-v2.bin (1.4MB)...',
		'[OK] Update confirmed by server (ACK 202)...',
		'[SYSTEM] Attaching snapshot listener for session sync...',
		'[UI] Reconciling Virtual DOM snapshots...',
		'[MEMORY] Garbage collecting inactive slider components...',
		'[FIRESTORE] Stream active: waiting for remote leader ACK...',
		'[SYSTEM] Calculating regional delta coefficients...',
		'[OK] Resource allocation verified by global consensus...',
		'[NETWORK] Pinging control node: latency 42ms...',
		'[UI] Warming up results breakdown engine...',
		'[SYSTEM] Background task: polling satellite telemetry...'
	];

	let visibleLines: string[] = $state([]);

	onMount(() => {
		let i = 0;
		let timeout: ReturnType<typeof setTimeout>;

		function addLine() {
			if (i < logs.length) {
				visibleLines = [...visibleLines, logs[i]];
				i++;
				const delay = i % 5 === 0 ? 1200 : Math.pow(Math.random(), 2) * 1000 + 50;
				timeout = setTimeout(addLine, delay);
			} else {
				timeout = setTimeout(() => {
					visibleLines = [...visibleLines, '> DECISION SENT SUCCESSFULLY.'];
					timeout = setTimeout(() => {
						visibleLines = [...visibleLines, '> OTHER LEADERS READY FOR DELIBERATION.'];
					}, 2000);
				}, 1000);
			}
		}

		addLine();

		return () => clearTimeout(timeout);
	});
</script>

<div class="terminal-wrapper">
	<div class="terminal-logs">
		{#each visibleLines as line}
			<div class="log-line" class:success={line.startsWith('>')}>{line}</div>
		{/each}
	</div>
	<div class="terminal-cursor">_</div>
</div>

<style>
	.terminal-wrapper {
		height: 300px;
		overflow-y: auto;
		display: flex;
		justify-content: flex-end;
		flex-direction: column;
		scrollbar-width: none;
		width: 100%;
		font-family: var(--font-code);
	}
	.terminal-wrapper::-webkit-scrollbar {
		display: none;
	}

	.terminal-logs {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.log-line {
		font-size: 0.9rem;
		color: var(--teal);
		letter-spacing: 1px;
		opacity: 0.8;
		animation: lineEntry 0.2s ease-out;
	}

	.log-line.success {
		color: var(--green);
		font-weight: bold;
		font-size: 1.1rem;
		margin-top: 1rem;
		text-shadow: 0 0 10px var(--green);
	}

	.terminal-cursor {
		color: var(--teal);
		animation: blink 1s step-end infinite;
		font-weight: bold;
	}
</style>
