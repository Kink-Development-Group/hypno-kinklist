<script lang="ts">
	import { KinkLevel } from '$lib/enums/Kink.enum';
	import type { KinkCategoryModel } from '$lib/models/KinkCategory.model';
	import KinkChoice from './KinkChoice.svelte';

	export let category: KinkCategoryModel;

	$: category = category;
</script>

<div class="kinkCategory">
	<h2>{category}</h2>
	<table class="kinkGroup">
		{#if category.multirow}
			<tr>
				<th>{category.rowTitles?.first}</th>
				<th>{category.rowTitles?.second}</th>
				<th></th>
			</tr>
			{#each category.kinks as kink}
				<tr>
					<td
						><KinkChoice level={KinkLevel.NotEntered} toggle /><KinkChoice
							level={KinkLevel.Favorite}
							toggle
						/><KinkChoice level={KinkLevel.Like} toggle /><KinkChoice
							level={KinkLevel.Okay}
							toggle
						/><KinkChoice level={KinkLevel.Maybe} toggle /><KinkChoice
							level={KinkLevel.No}
							toggle
						/></td
					>
					<td
						><KinkChoice level={KinkLevel.NotEntered} toggle /><KinkChoice
							level={KinkLevel.Favorite}
							toggle
						/><KinkChoice level={KinkLevel.Like} toggle /><KinkChoice
							level={KinkLevel.Okay}
							toggle
						/><KinkChoice level={KinkLevel.Maybe} toggle /><KinkChoice
							level={KinkLevel.No}
							toggle
						/></td
					>
					<td>{kink.name}</td>
				</tr>
			{/each}
		{:else}
			<tr>
				<td>General</td>
			</tr>
			{#each category.kinks as kink}
				<tr>
					<td
						><KinkChoice level={KinkLevel.NotEntered} toggle /><KinkChoice
							level={KinkLevel.Favorite}
							toggle
						/><KinkChoice level={KinkLevel.Like} toggle /><KinkChoice
							level={KinkLevel.Okay}
							toggle
						/><KinkChoice level={KinkLevel.Maybe} toggle /><KinkChoice
							level={KinkLevel.No}
							toggle
						/></td
					>
					<td>{kink.name}</td>
				</tr>
			{/each}
		{/if}
	</table>
</div>
