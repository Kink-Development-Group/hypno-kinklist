<script lang="ts">
	import type { KinkCategoryModel } from '$lib/models/KinkCategory.model';
	import { cleanKinkName } from '$lib/utility/cleanKinkName';
	import KinkRow from './KinkRow.svelte';
	export let category: KinkCategoryModel;

	$: category = category;
</script>

<div class="kinkCategory">
	<h2>{category.name}</h2>

	<table class="kinkGroup table">
		{#if category.multirow}
			<thead>
				<tr>
					<th>{category.rowTitles?.first}</th>
					<th>{category.rowTitles?.second}</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each category.kinks as kink}
					<tr>
						<td class="kinkRow">
							<KinkRow kinkName={kink.name} categorieName={category.name}></KinkRow>
						</td>
						<td class="kinkRow"
							><KinkRow kinkName={kink.name} categorieName={category.name} isSeccondRow={true}
							></KinkRow>
						</td>
						<td class="label">{kink.name}</td>
					</tr>
				{/each}
			</tbody>
		{:else}
			<thead>
				<tr>
					<th>General</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each category.kinks as kink}
					<tr>
						<td class="kinkRow">
							<KinkRow kinkName={cleanKinkName(kink.name)} categorieName={category.name}></KinkRow>
						</td>
						<td class="label">{kink.name}</td>
					</tr>
				{/each}
			</tbody>
		{/if}
	</table>
</div>

<style lang="sass">

h2, th, td
	font-family: 'Roboto', sans-serif

table
	width: 100%
	border-collapse: collapse
	border: 1px solid grey

thead
	background-color: gray
	color: white
	text-align: left
	margin: 0
	border: 1px solid gray

	th
		margin: 0

	th, td
		padding: 0.5rem

h2
	font-size: 1.2rem
	font-weight: 700
	margin-bottom: 0.5rem
	
.kinkCategory
	padding: 1rem
	width: fit-content
	padding-top: 0rem
	min-width: 20rem

.kinkGroup
	width: 100%

.kinkRow
	justify-content: center
	align-items: center
	border: 1px solid gray
	min-width: 132px
	height: 20px
	padding: 0.1rem

.label
	padding: 0 1rem
	width: 100%
	border: 1px solid gray
	border-left: none
	

</style>
