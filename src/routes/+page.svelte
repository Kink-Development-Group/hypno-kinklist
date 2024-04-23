<script lang="ts">
	import { KinkCategoryModel } from '$lib/models/KinkCategory.model';
	import { onMount } from 'svelte';
	import KinkCategory from '../components/KinkCategory.svelte';
	import * as initConfig from '$lib/config/initHypno.json';
	import type { KinkList } from '$lib/types/KinkList.type';

	const init: KinkList = initConfig as any as KinkList;

	let categories: KinkCategoryModel[] = init.categories;
</script>

<header>
	<h1>Kink list</h1>
	<div class="legend">
		<div class="legendItem">
			<span data-color="#FFFFFF" class="choice notEntered"></span>
			<span class="legend-text">Not Entered</span>
		</div>
		<div class="legendItem">
			<span data-color="#6DB5FE" class="choice favorite"></span>
			<span class="legend-text">Favorite</span>
		</div>
		<div class="legendItem">
			<span data-color="#23FD22" class="choice like"></span> <span class="legend-text">Like</span>
		</div>
		<div class="legendItem">
			<span data-color="#FDFD6B" class="choice okay"></span> <span class="legend-text">Okay</span>
		</div>
		<div class="legendItem">
			<span data-color="#DB6C00" class="choice maybe"></span> <span class="legend-text">Maybe</span>
		</div>
		<div class="legendItem">
			<span data-color="#920000" class="choice no"></span> <span class="legend-text">No</span>
		</div>
	</div>
</header>

<main>
	<div class="categories">
		{#each categories as category}
			<KinkCategory {category} />
		{/each}
	</div>
</main>

<style lang="sass">

header
	margin-left: 2rem

	.legend
		display: flex
		justify-content: space-around
		margin-bottom: 1rem
		margin-left: -0.8rem
		max-width: 600px

		.legendItem
			display: flex
			align-items: center

		.choice
			display: inline-block
			height: 15px
			width: 15px
			border-radius: 50%
			border: 1px solid black
			margin-right: 0.5rem

		.notEntered
			background-color: #FFFFFF
		
		.favorite
			background-color: #6DB5FE
		
		.like
			background-color: #23FD22
		
		.okay
			background-color: #FDFD6B
		
		.maybe
			background-color: #DB6C00
		
		.no
			background-color: #920000

.categories
	display: flex
	flex-direction: column
	align-items: flex-start
	flex-wrap: wrap

h1
	font-family: 'Roboto', sans-serif
	font-weight: 700

span
	font-family: 'Roboto', sans-serif
	font-weight: 500

main
	display: flex
	flex-direction: column
	margin: 0 auto
	padding: 0 1rem
	overflow-x: hidden

</style>
