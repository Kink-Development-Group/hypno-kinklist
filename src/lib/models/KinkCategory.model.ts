import type { KinkCategoryType } from '$lib/types/KinkCategory.type';
import type { Kink } from './Kink.model';

export class KinkCategoryModel implements KinkCategoryType {
	public name: string;
	public kinks: Kink[];
	public multirow: boolean;
	public rowTitles?: { first: string; second: string } | undefined;

	constructor(
		name: string,
		kinks: Kink[],
		multirow: boolean,
		rowTitles?: { first: string; second: string } | undefined
	) {
		this.name = name;
		this.kinks = kinks;
		this.multirow = multirow;
		this.rowTitles = rowTitles;
	}
}
