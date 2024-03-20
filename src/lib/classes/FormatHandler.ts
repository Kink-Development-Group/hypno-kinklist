import type { Kink } from '$lib/models/Kink.model';
import type { KinkCategoryModel } from '$lib/models/KinkCategory.model';
import type { KinkList } from '$lib/types/KinkList.type';

/**
 * Format handler
 */
export class FormatHandler {
	static transformToOldList(data: KinkList): string {
		let result = `#${data.name}\n\n`;

		for (const category of data.categories) {
			result += `(${category.name})\n`;
			if (category.multirow && category.rowTitles) {
				result += `(${category.rowTitles.first}, ${category.rowTitles.second})\n`;
			} else {
				result += '(General)\n';
			}
			for (const kink of category.kinks) {
				result += `* ${kink.name}\n`;
			}
			result += '\n';
		}

		return result.trim();
	}

	static transformToNewList(input: string): KinkList {
		const lines: string[] = input.split('\n').filter((line) => line.trim() !== '');
		const categories: KinkCategoryModel[] = [];

		let currentCategory: string | null = null;
		let kinks: Kink[] = [];
		let isMultirow: boolean = false;
		let rowTitles: { first: string; second: string } | undefined = undefined;

		for (const line of lines) {
			if (line.startsWith('#')) {
				if (currentCategory !== null) {
					categories.push({
						name: currentCategory,
						kinks,
						multirow: isMultirow,
						rowTitles
					});
				}
				currentCategory = line.substring(1).trim();
				kinks = [];
				isMultirow = false;
				rowTitles = undefined;
			} else if (line.startsWith('(')) {
				const titleMatch = line.match(/\(([^)]+)\)/);
				if (titleMatch) {
					const titles = titleMatch[1].split(',');
					if (titles.length === 2) {
						isMultirow = true;
						rowTitles = {
							first: titles[0].trim(),
							second: titles[1].trim()
						};
					}
				}
			} else {
				const kinkName = line.trim().substring(1);
				kinks.push({
					name: kinkName,
					description: '',
					level: 0
				});
			}
		}

		// Add the last category
		if (currentCategory !== null) {
			categories.push({
				name: currentCategory,
				kinks,
				multirow: isMultirow,
				rowTitles
			});
		}

		return {
			name: 'Kink List',
			categories
		};
	}
}
