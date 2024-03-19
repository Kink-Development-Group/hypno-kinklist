import type { OldKinkList } from '$lib/interfaces/oldList.interface';
import type { Kink } from '$lib/models/Kink.model';
import type { KinkCategoryModel } from '$lib/models/KinkCategory.model';
import type { KinkList } from '$lib/types/KinkList.type';

/**
 * Format handler
 */
export class FormatHandler {

	static transformToOldList(inputData: KinkList): OldKinkList {
		const outputData: OldKinkList = {};

		for (const category of inputData.categories) {
			const kinkNames: string[] = category.kinks.map((kink) => kink.name);
			outputData[category.name] = kinkNames;
		}

		return outputData;
	}

	static transformToNewList(outputData: OldKinkList): KinkList {
		const inputData: KinkList = {
			name: 'Kink List',
			categories: []
		};

		for (const categoryName in outputData) {
			if (Object.prototype.hasOwnProperty.call(outputData, categoryName)) {
				const kinkNames: string[] = outputData[categoryName];
				const kinks: Kink[] = kinkNames.map((name) => ({
					name,
					description: '',
					level: 0
				}));

				const category: KinkCategoryModel = {
					name: categoryName,
					kinks,
					multirow: false
				};

				inputData.categories.push(category);
			}
		}

		return inputData;
	}
}
