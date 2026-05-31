<script lang="ts">
	import { playSound } from '$lib/services/audio.service';
	let { label = '', name = 'textarea-name', value = $bindable(), rows = 4, onfocus, ...others } = $props();

	function handleFocus(e: any) {
		playSound('click');
		if (onfocus) onfocus(e);
	}
</script>

<div class="retro-textarea-container">
	{#if label}
		<label for={name}>{label}</label>
	{/if}
	<textarea class="retro-textarea" {name} {rows} bind:value onfocus={handleFocus} {...others}></textarea>
</div>

<style>
	.retro-textarea-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-family: var(--font-code);
		width: 100%;
	}

	label {
		color: var(--teal);
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.retro-textarea {
		font-family: var(--font-code);
		background: var(--muted-blue);
		border: none;
		outline: 2px solid var(--blue);
		padding: 1rem 1.5rem;
		color: var(--text-color);
		font-size: 1.1rem;
		border-radius: 6px;
		backdrop-filter: blur(5px);
		width: 100%;
		box-sizing: border-box;
		resize: vertical;
		transition:
			background 100ms,
			border-color 100ms,
			outline 100ms,
			outline-offset 150ms,
			box-shadow 200ms,
			transform 200ms;
	}

	.retro-textarea:hover {
		background: var(--muted-teal);
	}

	.retro-textarea::placeholder {
		color: var(--text-color);
		opacity: 0.7;
	}

	.retro-textarea:focus {
		border-color: var(--orange);
		box-shadow:
			0 0 20px var(--orange),
			inset 0 0 20px var(--orange);
		outline: 8px solid var(--orange);
		outline-offset: -4px;
		transform: translateX(10px);
	}

	.retro-textarea.invalid {
		border-color: var(--error-color) !important;
		box-shadow:
			0 0 20px var(--error-color),
			inset 0 0 20px var(--error-color) !important;
		outline: 6px solid var(--error-color) !important;
	}

	.retro-textarea.valid {
		border-color: var(--green) !important;
		box-shadow:
			0 0 15px var(--green),
			inset 0 0 10px rgba(34, 197, 94, 0.2) !important;
		outline: 4px solid var(--green) !important;
		outline-offset: -2px;
	}
</style>
