<script lang="ts">
    let { children } = $props();
</script>
<div class="btn-group">
    {@render children()}
</div>
<style>
    .btn-group {
        display: flex;
        gap: 2rem;
        margin-top: 1rem;
    }
</style>