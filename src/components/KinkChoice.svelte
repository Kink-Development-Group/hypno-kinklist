<script lang="ts">
	import type { KinkLevel } from '$lib/enums/Kink.enum';

	export let level: KinkLevel; // Ebene der Vorliebe (z. B. Like, Maybe, No)
</script>

<button class="choice {level}"></button>

<style>
	.blank {
		background-color: rgba(0, 0, 0, alpha);
	}
	.notEntered {
		background-color: rgb(255, 255, 255);
	}
	.favorite {
		background-color: rgb(109, 181, 254);
	}
	.like {
		background-color: rgb(35, 253, 34);
	}
	.okay {
		background-color: rgb(253, 253, 107);
	}
	.maybe {
		background-color: rgb(219, 108, 0);
	}
	.no {
		background-color: rgb(146, 0, 0);
	}


</style>
