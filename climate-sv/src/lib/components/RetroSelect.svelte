<script lang="ts">
	let { label = '', name = 'select-name', value = $bindable(), options = [], ...others } = $props<{
		label?: string;
		name?: string;
		value: any;
		options: { label: string; value: any }[];
		[key: string]: any;
	}>();
</script>

<div class="retro-select-container">
	{#if label}
		<label for={name}>{label}</label>
	{/if}
	<div class="select-wrapper">
		<select class="retro-select" {name} {...others} bind:value>
			{#each options as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</div>
</div>

<style>
	.retro-select-container {
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

	.select-wrapper {
		position: relative;
		width: 100%;
	}

	.retro-select {
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
		appearance: none;
		cursor: pointer;
		transition:
			background 100ms,
			border-color 100ms,
			outline 100ms,
			outline-offset 150ms,
			box-shadow 200ms,
			transform 200ms;
	}

	.retro-select:hover {
		background: var(--muted-teal);
	}

	.retro-select:focus {
		border-color: var(--orange);
		box-shadow:
			0 0 20px var(--orange),
			inset 0 0 20px var(--orange);
		outline: 8px solid var(--orange);
		outline-offset: -4px;
		transform: translateX(10px);
	}
	
	/* Custom arrow */
	.select-wrapper::after {
		content: "▼";
		position: absolute;
		right: 1.5rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--teal);
		pointer-events: none;
		font-size: 0.9rem;
	}
</style>
