import { strToClass } from "./Utils";

export interface KinkCategory {
	name: string;
	fields: string[];
	kinks: string[];
}

export class KinkEditor {
	private container: HTMLElement;
	private categories: KinkCategory[] = [];

	constructor(container: HTMLElement) {
		this.container = container;
		// Initialize with default data; in a complete implementation, this could be loaded from an external source or user input.
		this.categories = this.getDefaultCategories();
	}

	public init(): void {
		this.render();
		this.bindEvents();
	}

	private render(): void {
		// Container leeren
		this.container.innerHTML = "";

		// Header rendern
		const header = document.createElement("h1");
		header.textContent = "Kinklist";
		this.container.appendChild(header);

		// Legende rendern
		const legend = this.createLegend();
		this.container.appendChild(legend);

		// Kategorien und zugehörige Kink-Tabellen rendern
		const listContainer = document.createElement("div");
		listContainer.id = "kink-list";

		this.categories.forEach((category) => {
			const catDiv = document.createElement("div");
			catDiv.classList.add("kink-category", `cat-${strToClass(category.name)}`);

			const title = document.createElement("h2");
			title.textContent = category.name;
			catDiv.appendChild(title);

			// Tabelle für die Kategorie erstellen
			const table = document.createElement("table");
			table.classList.add("kink-table");

			// Tabellenkopf: Felder und eine Spalte für den Kink-Namen
			const thead = document.createElement("thead");
			const headerRow = document.createElement("tr");
			category.fields.forEach((field) => {
				const th = document.createElement("th");
				th.textContent = field;
				headerRow.appendChild(th);
			});
			const thName = document.createElement("th");
			thName.textContent = "Kink";
			headerRow.appendChild(thName);
			thead.appendChild(headerRow);
			table.appendChild(thead);

			// Tabellenkörper: Jeder Kink wird zu einer Zeile mit einem Button pro Feld
			const tbody = document.createElement("tbody");
			category.kinks.forEach((kink) => {
				const row = document.createElement("tr");
				row.classList.add("kink-row", `kink-${strToClass(kink)}`);
				category.fields.forEach((field) => {
					const td = document.createElement("td");
					const button = document.createElement("button");
					button.classList.add("choice");
					button.textContent = field;
					// Toggle der Auswahl bei Klick
					button.addEventListener("click", () => {
						button.classList.toggle("selected");
					});
					td.appendChild(button);
					row.appendChild(td);
				});
				const tdName = document.createElement("td");
				tdName.textContent = kink;
				row.appendChild(tdName);

				tbody.appendChild(row);
			});
			table.appendChild(tbody);
			catDiv.appendChild(table);
			listContainer.appendChild(catDiv);
		});
		this.container.appendChild(listContainer);

		// Export-Button rendern
		const exportBtn = document.createElement("button");
		exportBtn.id = "export-btn";
		exportBtn.textContent = "Export";
		this.container.appendChild(exportBtn);
	}

	private bindEvents(): void {
		// Beispielhafte Event-Bindung für den Export-Button
		const exportBtn = document.getElementById("export-btn");
		if (exportBtn) {
			exportBtn.addEventListener("click", () => {
				alert("Export-Funktionalität ist in diesem Beispiel nicht implementiert.");
			});
		}
	}

	private createLegend(): HTMLElement {
		const legend = document.createElement("div");
		legend.classList.add("legend");
		const levels = ["Not Entered", "Favorite", "Like", "Okay", "Maybe", "No"];
		const colors = [
			"#FFFFFF",
			"#6DB5FE",
			"#23FD22",
			"#FDFD6B",
			"#DB6C00",
			"#920000",
		];

		levels.forEach((level, index) => {
			const legendItem = document.createElement("div");
			const colorBox = document.createElement("span");
			colorBox.classList.add("choice");
			colorBox.style.backgroundColor = colors[index];
			legendItem.appendChild(colorBox);

			const label = document.createElement("span");
			label.classList.add("legend-text");
			label.textContent = level;
			legendItem.appendChild(label);

			legend.appendChild(legendItem);
		});
		return legend;
	}

	private getDefaultCategories(): KinkCategory[] {
		// Standarddaten ähnlich dem ursprünglichen Kinklist-Text
		return [
			{
				name: "Bodies",
				fields: ["General"],
				kinks: ["Skinny", "Chubby", "Small breasts", "Large breasts"],
			},
			{
				name: "Clothing",
				fields: ["Self", "Partner"],
				kinks: ["Clothed sex", "Lingerie", "Stockings"],
			},
			{
				name: "Groupings",
				fields: ["General"],
				kinks: ["You and 1 male", "You and 1 female", "Orgy"],
			},
		];
	}
}
