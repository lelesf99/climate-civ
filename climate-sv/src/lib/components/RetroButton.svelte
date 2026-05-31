<script lang="ts">
	import { playSound } from '$lib/services/audio.service';

	let {
		children,
		btnLink = false,
		href = '',
		secondary = false,
		danger = false,
		muted = false,
		mini = false,
		onclick,
		onfocus,
		onblur,
		...others
	} = $props();
	let active = $state(false);

	function handleClick(e: any) {
		playSound('click');
		if (onclick) onclick(e);
	}

	function handleFocus(e: any) {
		active = true;
		if (onfocus) onfocus(e);
	}

	function handleBlur(e: any) {
		active = false;
		if (onblur) onblur(e);
	}
</script>

<svelte:element
	this={btnLink ? 'a' : 'button'}
	href={btnLink ? href : undefined}
	class={['retro-btn', { secondary, danger, muted, mini }]}
	onfocus={handleFocus}
	onblur={handleBlur}
	onclick={handleClick}
	{...others}
>
	{@render children()}
</svelte:element>

<style>
	.retro-btn {
		flex: 1 1 auto;
		text-decoration: none;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: var(--muted-orange);
		border: 2px solid var(--orange);
		box-shadow: 0 0 10px var(--muted-orange);
		border-radius: 4px;

		color: var(--orange);
		text-shadow: 0 0 5px var(--orange);

		padding: 1rem;
		font-size: 1.3rem;
		font-weight: 800;
		font-family: var(--font-head);

		cursor: pointer;
		transition: all 0.2s;
		text-transform: uppercase;
		letter-spacing: 2px;
		animation: slideIn 0.3s ease-out;
		align-self: var(--align-self, auto);
	}

	.retro-btn:hover,
	.retro-btn:focus {
		background: var(--orange);
		color: var(--light-color) !important;
		box-shadow: 0 0 30px var(--orange);
		text-shadow: none;
		transform: scale(1.05);
		outline: 8px solid var(--orange);
		outline-offset: -4px;
	}

	.retro-btn:active {
		transform: scale(1);
	}

	.retro-btn:disabled {
		opacity: 0.5;
		filter: grayscale(0.8);
		cursor: not-allowed;
		pointer-events: none;
		box-shadow: none;
		text-shadow: none;
		transform: none;
	}
	/* ---------- */
	/* SECONDARY  */
	/* ---------- */

	.retro-btn.secondary {
		background: var(--muted-teal);
		border: 2px solid var(--teal);
		color: var(--teal);
		text-shadow: 0 0 5px var(--teal);
	}

	.retro-btn.secondary:hover,
	.retro-btn.secondary:focus {
		background: var(--teal);
		box-shadow: 0 0 30px var(--teal);
		outline: 8px solid var(--teal);
	}

	.retro-btn.danger {
		background: var(--muted-error-color);
		border: 2px solid var(--error-color);
		color: var(--error-color);
		text-shadow: 0 0 5px var(--error-color);
	}

	.retro-btn.danger:hover,
	.retro-btn.danger:focus {
		background: var(--error-color);
		box-shadow: 0 0 30px var(--error-color);
		outline: 8px solid var(--error-color);
	}
	/* ------ */
	/* MUTED  */
	/* ------ */
	.retro-btn.muted {
		background: var(--muted-blue);
		border: 2px solid var(--blue);
		color: var(--blue);
		text-shadow: 0 0 5px var(--blue);
	}

	.retro-btn.muted:hover,
	.retro-btn.muted:focus {
		background: var(--blue);
		box-shadow: 0 0 30px var(--blue);
		outline: 8px solid var(--blue);
	}
	/* ----- */
	/* MINI  */
	/* ----- */
	.retro-btn.mini {
		padding: 0.5rem 0.5rem;
		font-size: 1rem;
		flex: 0 0 auto;
	}
	/* 
	.retro-btn.toggle {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.retro-btn.toggle.active {
		background: var(--green);
		color: var(--light-color) !important;
		border-color: var(--green);
		box-shadow: 0 0 20px var(--green);
		text-shadow: none;
	}

	.retro-btn.toggle.active:hover,
	.retro-btn.toggle.active:focus {
		box-shadow: 0 0 30px var(--green);
		outline: 8px solid var(--green);
	} */
</style>
