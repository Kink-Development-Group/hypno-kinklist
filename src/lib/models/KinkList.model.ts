import type { KinkCategoryModel } from './KinkCategory.model';

export class KinkListModel {
	public name: string;
	public categories: KinkCategoryModel[];

	constructor(name: string, categories: KinkCategoryModel[]) {
		this.name = name;
		this.categories = categories;
	}
}
