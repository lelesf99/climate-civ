<script lang="ts">
	let {
		name,
		score = 0,
		continent = '',
		statusLabel = '',
		statusLed = ''
	}: {
		name: string;
		score?: number;
		continent?: string;
		statusLabel?: string;
		statusLed?: string;
	} = $props();
</script>

<div class="player-card">
	<div class="player-card-header">
		<div class="player-card-id">
			<span class="player-card-name">
				{#if statusLed}<span class="player-led" style:--led-color={statusLed}></span>{/if}
				{name}
			</span>
			{#if continent}
				<span class="player-card-continent">{continent}</span>
			{/if}
			{#if statusLabel}<span class="player-status-text">{statusLabel}</span>{/if}
		</div>
		<div class="player-card-score">
			{#if score !== undefined}
				<span class="score-num">{score}</span>
				<span class="score-lbl">pts</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.player-card {
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		border: 2px solid var(--blue);
		border-radius: 0.5rem;
		background: var(--bg-blue);
		transition: all 0.15s;
		animation: card-entry 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.player-card:hover {
		border-color: var(--teal);
		transform: translateX(4px);
	}

	.player-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.player-card-id {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.player-card-name {
		font-family: var(--font-head);
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 1px;
	}

	.player-card-continent {
		font-family: var(--font-code);
		font-size: 0.8rem;
		color: var(--orange);
		text-transform: uppercase;
	}

	.player-card-score {
		text-align: right;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.score-num {
		font-family: var(--font-head);
		font-size: 0.9rem;
		color: var(--orange);
		font-weight: 700;
	}

	.score-lbl {
		font-family: var(--font-code);
		font-size: 0.6rem;
		opacity: 0.7;
	}

	.player-led {
		background-color: #ffffff;
		border: 4px solid var(--led-color);
		box-shadow: 0 0 10px var(--led-color);
		position: relative;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		display: inline-block;
		margin-right: 0.5rem;
	}
</style>
