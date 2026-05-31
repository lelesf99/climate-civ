<script>
	import { fly } from 'svelte/transition';
	import { snackbar } from '../stores/snackbar.store';
	import RetroButton from './RetroButton.svelte';
	$effect(() => {
		if ($snackbar && !$snackbar.actions?.length) {
			const timeout = setTimeout(() => {
				snackbar.set(null);
			}, $snackbar.duration || 3000);
			return () => clearTimeout(timeout);
		}
	});
</script>

{#if $snackbar}
	<div transition:fly={{ y: 200, duration: 150 }} class={['snackbar-overlay', $snackbar.position]}>
		<p>{$snackbar.message}</p>
		{#if $snackbar.actions?.length}
			<div class="actions">
				{#each $snackbar.actions as action}
					<RetroButton onclick={action.callback} muted mini>{action.label}</RetroButton>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.snackbar-overlay {
        display: flex;
        align-items: center;
		position: fixed;
		bottom: 1rem;
        border-radius: var(--border-radius-pill);
        background-color: var(--muted-blue);
		color: var(--text-color);
        outline: 2px solid var(--blue);
		width: 100%;
		max-width: 400px;
		text-align: center;
		padding: 1rem;
		z-index: 1000;
	}
	.snackbar-overlay.center {
		left: 50%;
		transform: translateX(-50%);
	}
	.snackbar-overlay.left {
		left: 1rem;
	}
	.snackbar-overlay.right {
		right: 1rem;
	}

    .actions {
        margin-top: 0.5rem;
        display: flex;
        justify-content: flex-end;
        width: 100%;
        gap: 0.5rem;
    }
</style>
