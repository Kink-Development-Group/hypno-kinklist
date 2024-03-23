import { KinkCategoryModel } from '$lib/models/KinkCategory.model';
import { KinkListModel } from '$lib/models/KinkList.model';
import initConfig from '$lib/config/init.json';
import type { Kink } from '$lib/models/Kink.model';

export class AppState {
	private static _instance: AppState;

	private kinkList: KinkListModel = new KinkListModel('Kink List', []);
	private saveKey = 'kinkList';

	private constructor() {}

	public static get instance(): AppState {
		if (!AppState._instance) {
			AppState._instance = new AppState();
			AppState._instance.init();
		}
		return AppState._instance;
	}

	private init(): void {
		this.kinkList.name = initConfig.name;
		this.kinkList.categories = initConfig.categories.map((category) => {
			const kinks = category.kinks.map((kink: Kink) => {
				if (kink.seccondaryLevel) {
					return {
						name: kink.name,
						description: kink.description,
						level: kink.level,
						seccondaryLevel: kink.seccondaryLevel
					} as Kink;
				}
				return {
					name: kink.name,
					description: kink.description,
					level: kink.level
				} as Kink;
			});

			return new KinkCategoryModel(
				category.name,
				kinks,
				category.multirow,
				{
					first: category.rowTitles?.first ?? '',
					second: category.rowTitles?.second ?? ''
				} ?? undefined
			);
		});
	}

	private loadModel(): void {
		const savedModel = localStorage.getItem(this.saveKey);
		if (savedModel) {
			this.kinkList = JSON.parse(savedModel) as KinkListModel;
		}
	}

	private saveModel(): void {
		localStorage.setItem(this.saveKey, JSON.stringify(this.kinkList));
	}

	public getKinkList(): KinkListModel {
		return this.kinkList;
	}

	public setKinkList(kinkList: KinkListModel): void {
		this.kinkList = kinkList;
	}

	public getKinkCategory(name: string): KinkCategoryModel | undefined {
		return this.kinkList.categories.find((category) => category.name === name);
	}

	public addKinkCategory(category: KinkCategoryModel): void {
		this.kinkList.categories.push(category);
	}
}
