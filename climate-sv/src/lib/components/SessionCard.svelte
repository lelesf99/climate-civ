<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		code,
		playerCount = 0,
		createdAt,
		actions
	}: {
		code: string;
		playerCount?: number;
		createdAt?: number;
		actions?: Snippet;
	} = $props();

	const dateStr = $derived(
		createdAt ? new Date(createdAt).toLocaleString('en-US') : 'Unknown date'
	);
</script>

<div class="session-card">
	<div class="session-info">
		<span class="session-code">MISSION {code}</span>
		<span class="session-meta">{playerCount} LEADERS | {dateStr}</span>
	</div>
	{#if actions}
		<div class="session-actions">
			{@render actions()}
		</div>
	{/if}
</div>

<style>
	.session-card {
		gap: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--muted-teal);
		border: 1px solid var(--teal);
		padding: 1.2rem;
		border-radius: 8px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		animation: slideIn 0.3s ease-out;
	}
	.session-card:hover {
		border-color: var(--teal);
		background: rgba(32, 211, 238, 0.1);
		transform: translateX(5px);
	}
	.session-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.session-code {
		font-family: var(--font-head);
		font-size: 1.1rem;
		font-weight: 700;
		letter-spacing: 2px;
	}
	.session-meta {
		font-family: var(--font-code);
		color: var(--orange);
		font-size: 0.8rem;
	}
	.session-actions {
		display: flex;
		gap: 1rem;
		flex-shrink: 0;
	}
</style>
