<script lang="ts">
	let {
		label,
		variant = ''
	}: {
		label: string;
		variant?: string;
	} = $props();
</script>

<span class="status-badge" class:variant>{label}</span>
