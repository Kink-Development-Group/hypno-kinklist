<script lang="ts">
	import { KinkLevel } from '$lib/enums/Kink.enum';
	import { AppState } from '$lib/services/State.srvs';
	import { cleanKinkName } from '$lib/utility/cleanKinkName';
	import { onMount } from 'svelte';

	export let kinkName: string;
	export let categorieName: string;
	export let isSeccondRow: boolean = false;

	const uniqueId =
		'c_' + cleanKinkName(kinkName) + '_' + Math.random().toString(36).substring(7).toString();

	let setIsActive = (kinklevel: KinkLevel): string => {
		return '';
	};

	onMount(() => {
		const choices = document.getElementsByClassName(uniqueId);

		setIsActive = (kinklevel: KinkLevel): string => {
			const state = AppState.getInstance();
			const categorie = state.getKinkCategory(categorieName);
			if (!categorie) {
				return '';
			}
			const kink = categorie.kinks.find((kink) => cleanKinkName(kink.name) === kinkName);
			if (!kink) {
				return '';
			}

			if (isSeccondRow) {
				if (kink.seccondaryLevel === kinklevel) {
					return 'active';
				}
			} else {
				if (kink.level === kinklevel) {
					return 'active';
				}
			}

			return '';
		};

		for (let choice of choices) {
			choice.addEventListener('click', (e) => {
				const state = AppState.getInstance();
				const target = e.target as HTMLButtonElement;
				const categorie = state.getKinkCategory(categorieName);
				if (!categorie) {
					return;
				}
				const kink = categorie.kinks.find((kink) => cleanKinkName(kink.name) === kinkName);
				if (!kink) {
					return;
				}

				if (isSeccondRow) {
					kink.seccondaryLevel = parseInt(target.value);
				} else {
					kink.level = parseInt(target.value);
				}

				state.updateKink(kink);

				for (let choice of choices) {
					choice.classList.remove('active');
				}

				target.classList.add('active');
			});
		}

		const categorie = AppState.getInstance().getKinkCategory(categorieName);

		if (!categorie) {
			return;
		}

		const kink = categorie.kinks.find((kink) => cleanKinkName(kink.name) === kinkName);

		if (!kink) {
			return;
		}
	});
</script>

<button
	value={KinkLevel.NotEntered}
	class="choice {uniqueId} notentered {setIsActive(KinkLevel.NotEntered)}"
></button>
<button
	value={KinkLevel.Favorite}
	class="choice {uniqueId} favorite {setIsActive(KinkLevel.Favorite)}"
></button>
<button value={KinkLevel.Like} class="choice {uniqueId} like {setIsActive(KinkLevel.Like)}"
></button>
<button value={KinkLevel.Okay} class="choice {uniqueId} okay {setIsActive(KinkLevel.Okay)}"
></button>
<button value={KinkLevel.Maybe} class="choice {uniqueId} maybe {setIsActive(KinkLevel.Maybe)}"
></button>
<button value={KinkLevel.No} class="choice {uniqueId} no {setIsActive(KinkLevel.No)}"></button>

<style lang="sass">
.choice, .choice2
	width: 14px
	height: 14px
	border: none
	border-radius: 50%
	border: 1px solid gray
	cursor: pointer
	transition: background-color 0.3s
	margin: 0 0.12rem
	opacity: 0.5
	&:hover 
		opacity: 1

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

.active
	opacity: 1
	border: 1px solid black
</style>
