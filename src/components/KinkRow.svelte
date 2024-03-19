<script lang="ts">
	import type { KinkLevel } from '$lib/enums/Kink.enum';
	import type { Kink } from '$lib/models/Kink.model';
	import KinkChoice from './KinkChoice.svelte';

	export let kink: Kink;
	export let kinkLevel: KinkLevel[]; // Auswahlmöglichkeiten für den Kink
</script>

<tr class="kinkRow">
	{#each kinkLevel as level}
		<KinkChoice level={level} />
	{/each}
	<td>{kink.name}</td>
</tr>
