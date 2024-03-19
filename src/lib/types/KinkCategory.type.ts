import type { Kink } from "$lib/models/Kink.model";

export type KinkCategoryType = {
	name: string;
	kinks: Kink[];
	multirow: boolean;
	rowTitles?: {
		first: string;
		second: string;
	};
};