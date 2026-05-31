<script lang="ts">
	let { header, index = -1, children } = $props();
</script>

<div class="tutorial-card">
	<div class="header">
		{#if index >= 0}<h3 class="index">{index}</h3>{/if}
		<h3 class="title">{header}</h3>
	</div>
	<div class="body">
		{@render children()}
	</div>
</div>

<style>
	.tutorial-card {
		outline: 0px solid var(--teal);
		padding: 1rem 2rem;
		border-radius: 8px;
		transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		max-width: 700px;
	}

	.tutorial-card:hover,
	.tutorial-card:active,
	.tutorial-card:focus {
		outline: 8px solid var(--teal);
		outline-offset: -4px;
		background: var(--muted-teal);
		box-shadow:
			0 0 20px var(--teal),
			inset 0 0 20px var(--teal);
		transform: scale(1.05);
	}

	.tutorial-card:hover .index,
	.tutorial-card:active .index,
	.tutorial-card:focus .index {
		color: white;
		text-shadow: 0 0 10px var(--teal);
	}

	.tutorial-card:nth-child(even) {
		align-self: flex-end;
		outline-color: var(--orange);
	}

	.tutorial-card:nth-child(even) .header {
		flex-direction: row-reverse;
	}

	.tutorial-card:nth-child(even) .index {
		color: var(--orange);
	}

	.tutorial-card:nth-child(even) .body {
		border-top: 1px solid var(--orange);
	}

	.tutorial-card:nth-child(even):hover .index,
	.tutorial-card:nth-child(even):active .index,
	.tutorial-card:nth-child(even):focus .index {
		color: white;
		text-shadow: 0 0 10px var(--orange);
	}

	.tutorial-card:nth-child(even):hover,
	.tutorial-card:nth-child(even):active,
	.tutorial-card:nth-child(even):focus {
		outline-color: var(--orange);
		background: var(--muted-orange);
		box-shadow:
			0 0 20px var(--orange),
			inset 0 0 20px var(--orange);
	}

	.header {
		display: flex;
		align-items: center;
		gap: 2.5rem;
		margin-bottom: 2.5rem;
		justify-content: space-between;
	}

	.index {
		font-family: var(--font-head);
		font-size: 3.5rem;
		font-weight: 900;
		color: var(--teal);
		opacity: 0.9;
		transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.tutorial-card .title {
		color: var(--text-color);
		font-family: var(--font-body);
		font-size: 2.5rem;
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 5px;
		font-weight: 900;
	}

	.tutorial-card .body {
		border-top: 1px solid var(--teal);
		padding-top: 1rem;
		font-size: 1.4rem;
		opacity: 1;
		line-height: 1.8;
		margin: 0;
		font-weight: 400;
	}
</style>
