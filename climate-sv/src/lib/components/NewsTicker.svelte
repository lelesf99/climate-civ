<script lang="ts">
	let { newsItems = [] }: { newsItems: string[] } = $props();
</script>

{#if newsItems.length > 0}
	<div class="news-ticker-container">
		<div class="news-ticker-track">
			<!-- Original Items -->
			{#each newsItems as item, idx (idx)}
				<div class="news-item">
					<div class="news-dot"></div>
					<span class="news-text">{item}</span>
				</div>
			{/each}
			<!-- Duplicated Items for Seamless Loop -->
			{#each newsItems as item, idx ('dup-' + idx)}
				<div class="news-item">
					<div class="news-dot"></div>
					<span class="news-text">{item}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.news-ticker-container {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100vw;
		background: rgba(0, 0, 0, 0.85);
		border-top: 2px solid var(--orange);
		overflow: hidden;
		padding: 0.5rem 0;
		z-index: 1000;
	}

	.news-ticker-track {
		display: flex;
		white-space: nowrap;
		width: max-content;
		animation: ticker-roll 45s linear infinite;
	}

	.news-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0 3rem;
		font-family: var(--font-code);
		font-size: 1.1rem;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 700;
		letter-spacing: 1px;
	}

	.news-dot {
		height: 0.6rem;
		width: 0.6rem;
		background-color: var(--orange);
		border-radius: 50%;
		box-shadow: 0 0 10px var(--orange);
	}

	@keyframes ticker-roll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}
</style>
