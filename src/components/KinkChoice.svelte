<script lang="ts">
	import type { KinkLevel } from '$lib/enums/Kink.enum';

	export let level: KinkLevel;
	export let toggle: (kinkLevel: KinkLevel) => KinkLevel;
	export let active: boolean = false;

	$: level = level;
	$: toggle = toggle;
	$: active = active;
</script>

<button
	on:click={() => toggle(level)}
	class="choice {level.toString().toLowerCase()} {active ? 'active' : ''}"
></button>

<style lang="sass">

.active 
	filter: brightness(1.1)

.choice 
	width: 100%
	height: 100%
	border: none
	border-radius: 50%
	border: 1px solid black
	cursor: pointer
	transition: background-color 0.3s
	&:hover 
		filter: brightness(1.1)

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
