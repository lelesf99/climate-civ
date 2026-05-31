<script lang="ts">
	let {
		message = 'Loading...'
	}: {
		message?: string;
	} = $props();
</script>

<div class="loading-container">
	<div class="loading-bar">
		<div class="loading-fill"></div>
	</div>
	<p class="loading-msg">{message}</p>
</div>

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		max-width: 400px;
	}
	.loading-bar {
		width: 100%;
		height: 4px;
		background: var(--muted-blue);
		border-radius: 2px;
		overflow: hidden;
	}
	.loading-fill {
		width: 40%;
		height: 100%;
		background: linear-gradient(90deg, var(--teal), var(--orange));
		border-radius: 2px;
		animation: slide 1.5s ease-in-out infinite;
	}
	.loading-msg {
		font-family: var(--font-code);
		font-size: 0.85rem;
		opacity: 0.6;
	}

	@keyframes slide {
		0% {
			transform: translateX(-100%);
		}
		50% {
			transform: translateX(150%);
		}
		100% {
			transform: translateX(-100%);
		}
	}
</style>
