<script lang="ts">
	import { KinkLevel } from '$lib/enums/Kink.enum';
	import KinkChoice from './KinkChoice.svelte';

	export let selection: KinkLevel;
	export let toggle: boolean;

	$: selection = selection;
	$: toggle = toggle;
</script>

<div>
	<KinkChoice level={KinkLevel.NotEntered} toggle={(level) => selection = level} />
	<KinkChoice level={KinkLevel.Favorite} toggle={(level) => selection = level} />
	<KinkChoice level={KinkLevel.Like} toggle={(level) => selection = level} />
	<KinkChoice level={KinkLevel.Okay} toggle={(level) => selection = level} />
	<KinkChoice level={KinkLevel.Maybe} toggle={(level) => selection = level} />
	<KinkChoice level={KinkLevel.No} toggle={(level) => selection = level} />
</div>
