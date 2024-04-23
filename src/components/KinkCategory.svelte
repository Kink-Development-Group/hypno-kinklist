<script lang="ts">
	import { KinkLevel } from '$lib/enums/Kink.enum';
	import type { Kink } from '$lib/models/Kink.model';
	import type { KinkCategoryModel } from '$lib/models/KinkCategory.model';
	import { AppState } from '$lib/services/State.srvs';
	import { onMount } from 'svelte';

	export let category: KinkCategoryModel;

	$: category = category;

	const cleanKinkName = (name: string) =>
		name.toLocaleLowerCase().replaceAll(' ', '').replaceAll('_', '-');

	
	onMount(() => {
		const choices = document.querySelectorAll('.choice');
		choices.forEach((choice) => {
			choice.addEventListener('click', (e) => {
				const target = e.target as HTMLButtonElement;
				const value = target.value;
				const className = target.classList[1];
				const kinkName = className.split('_')[1];
				const kink = category.kinks.find((kink: Kink) => cleanKinkName(kink.name) === kinkName);
				if (!kink) {
					return;
				}

				const isSecondRow = target.classList.contains('choice2');

				if (isSecondRow) {
					kink.seccondaryLevel = parseInt(value);
				} else {
					kink.level = parseInt(value);
				}

				const state = AppState.getInstance();

				state.updateKink(kink);

				choices.forEach((choice) => {
					choice.classList.remove('active');
				});

				target.classList.add('active');
			});
		});
	});
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
							<button
								value={KinkLevel.NotEntered}
								class="choice c_{cleanKinkName(kink.name)} notentered"
							></button>
							<button
								value={KinkLevel.Favorite}
								class="choice c_{cleanKinkName(kink.name)} favorite"
							></button>
							<button value={KinkLevel.Like} class="choice c_{cleanKinkName(kink.name)} like"
							></button>
							<button value={KinkLevel.Okay} class="choice c_{cleanKinkName(kink.name)} okay"
							></button>
							<button value={KinkLevel.Maybe} class="choice c_{cleanKinkName(kink.name)} maybe"
							></button>
							<button value={KinkLevel.No} class="choice c_{cleanKinkName(kink.name)} no"></button>
						</td>
						<td class="kinkRow">
							<button
								value={KinkLevel.NotEntered}
								class="choice2 c_{cleanKinkName(kink.name)} notentered"
							></button>
							<button
								value={KinkLevel.Favorite}
								class="choice2 c_{cleanKinkName(kink.name)} favorite"
							></button>
							<button value={KinkLevel.Like} class="choice2 c_{cleanKinkName(kink.name)} like"
							></button>
							<button value={KinkLevel.Okay} class="choice2 c_{cleanKinkName(kink.name)} okay"
							></button>
							<button value={KinkLevel.Maybe} class="choice2 c_{cleanKinkName(kink.name)} maybe"
							></button>
							<button value={KinkLevel.No} class="choice2 c_{cleanKinkName(kink.name)} no"></button>
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
							<button
								value={KinkLevel.NotEntered}
								class="choice c_{cleanKinkName(kink.name)} notentered"
							></button>
							<button
								value={KinkLevel.Favorite}
								class="choice c_{cleanKinkName(kink.name)} favorite"
							></button>
							<button value={KinkLevel.Like} class="choice c_{cleanKinkName(kink.name)} like"
							></button>
							<button value={KinkLevel.Okay} class="choice c_{cleanKinkName(kink.name)} okay"
							></button>
							<button value={KinkLevel.Maybe} class="choice c_{cleanKinkName(kink.name)} maybe"
							></button>
							<button value={KinkLevel.No} class="choice c_{cleanKinkName(kink.name)} no"></button>
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
	// width: 100%
	min-width: 500px

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

.choice, .choice2
	width: 14px
	height: 14px
	border: none
	border-radius: 50%
	border: 1px solid black
	cursor: pointer
	transition: background-color 0.3s
	margin: 0 0.12rem
	&:hover 
		filter: brightness(2)

.notentered 
	background-color: rgb(255, 255, 255)

.favorite 
	background-color: rgb(109, 181, 254)

.like 
	background-color: rgb(35, 253, 34)

.okay 
	background-color: rgb(253, 253, 107)

.maybe 
	background-color: rgb(219, 108, 0)

.no 
	background-color: rgb(146, 0, 0)
	

</style>
