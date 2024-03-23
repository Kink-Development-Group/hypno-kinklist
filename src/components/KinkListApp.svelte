<script lang="ts">
	import { onMount } from 'svelte';
	import { KinkCategoryModel } from '$lib/models/KinkCategory.model';
	import KinkCategory from './KinkCategory.svelte';

	let categories: KinkCategoryModel[] = [];

	// Beispiel-Daten
	onMount(() => {
		// Hier könnten die Daten geladen werden
		categories = [];
	});
</script>

{#each categories as category}
	<KinkCategory {category} />
{/each}
