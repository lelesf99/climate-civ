<script lang="ts">
	let {
		id,
		name,
		value = $bindable(0),
		max = 100,
		onchange
	}: {
		id: string;
		name: string;
		value: number;
		max?: number;
		onchange?: (val: number) => void;
	} = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = parseInt(target.value) || 0;
		if (onchange) {
			onchange(val);
		} else {
			value = val;
		}
	}
</script>

<div class="resource-slider">
	<div class="slider-header">
		<label for={id}>{name}</label>
		<span class="slider-value">{value}%</span>
	</div>
	<input type="range" {id} min="0" {max} value={value} oninput={handleInput} data-id={id} />
	<div class="slider-track-fill" style="width: {(value / max) * 100}%"></div>
</div>

<style>
	/* Legacy: .slider-group from ui.css */
	.resource-slider {
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}
	.resource-slider:not(:last-child) {
		border-bottom: 1px solid var(--blue);
	}
	.slider-header {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 30%;
	}
	label {
		font-family: var(--font-body);
		font-size: 0.9rem;
		font-weight: 600;
	}
	.slider-value {
		font-family: var(--font-head);
		font-size: 1rem;
		font-weight: 900;
		color: var(--orange);
	}

	input[type='range'] {
		flex: 0 0 50%;
		-webkit-appearance: none;
		appearance: none;
		background: var(--bg-orange);
		height: 12px;
		border-radius: 6px;
		outline: none;
		border: 2px solid var(--orange);
		cursor: pointer;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 24px;
		height: 24px;
		background: var(--orange);
		border-radius: 50%;
		cursor: pointer;
		transition: 100ms;
	}

	input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 0 10px var(--orange);
	}

	input[type='range']::-moz-range-thumb {
		width: 24px;
		height: 24px;
		background: var(--orange);
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}

	/* Hidden — legacy uses native track, no overlay needed */
	.slider-track-fill {
		display: none;
	}
</style>
