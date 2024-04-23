import type { KinkCategoryType } from '$lib/types/KinkCategory.type';
import type { Kink } from './Kink.model';

/**
 * Kink category model
 * @class
 * @classdesc A kink category model
 * @param {string} name - The name of the category
 * @param {Kink[]} kinks - The kinks in the category
 * @param {boolean} multirow - Whether the category is multirow
 * @param {{ first: string; second: string }} rowTitles - The row titles for the category
 * @example
 * const category = new KinkCategoryModel('Bondage', [new Kink('Bondage', 'The act of tying someone up', KinkLevel.Light)], false);
 * console.log(category); // KinkCategoryModel { name: 'Bondage', kinks: [Kink { name: 'Bondage', description: 'The act of tying someone up', level: KinkLevel.Light }], multirow: false }
 */
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
