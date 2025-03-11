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
		// Initialize with default data; in a complete implementation, this could be loaded externally.
		this.categories = this.getDefaultCategories();
	}

	public init(): void {
		this.render();
		this.bindEvents();
		this.restoreFromHash();
	}

	private render(): void {
		this.container.innerHTML = "";

		// Header rendern
		const header = document.createElement("h1");
		header.textContent = "Kinklist";
		this.container.appendChild(header);

		// Neuen Edit-Button einfügen
		const editBtn = document.createElement("button");
		editBtn.id = "edit-btn";
		editBtn.textContent = "Edit";
		this.container.appendChild(editBtn);

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
					// Toggle der Auswahl bei Klick und Hash-Updating
					button.addEventListener("click", () => {
						button.classList.toggle("selected");
						this.updateHash();
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
		// Bindung des Export-Buttons
		const exportBtn = document.getElementById("export-btn");
		if (exportBtn) {
			exportBtn.addEventListener("click", () => {
				this.exportKinklist();
			});
		}
		// Bindung des Edit-Buttons
		const editBtn = document.getElementById("edit-btn");
		if (editBtn) {
			editBtn.addEventListener("click", () => {
				this.showEditOverlay();
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

	// Aktualisiert den URL-Hash basierend auf dem Status aller .choice-Buttons (1 = ausgewählt, 0 = nicht)
	private updateHash(): void {
		const choices = Array.from(document.querySelectorAll("button.choice"));
		const state = choices.map(btn => btn.classList.contains("selected") ? "1" : "0").join("");
		window.location.hash = state;
	}

	// Liest den Hash und setzt den Status der Choice-Buttons entsprechend, falls die Länge übereinstimmt.
	private restoreFromHash(): void {
		const hash = window.location.hash.substring(1);
		const choices = Array.from(document.querySelectorAll("button.choice"));
		if (hash.length === choices.length) {
			choices.forEach((btn, idx) => {
				if (hash[idx] === "1") btn.classList.add("selected");
				else btn.classList.remove("selected");
			});
		}
	}

	// Export-Funktion: Erzeugt eine Leinwand, zeichnet Header, Legend und Listeneinträge, lädt per Imgur hoch
	private exportKinklist(): void {
		// Leinwand erstellen
		const canvas = document.createElement("canvas");
		canvas.width = 800;
		canvas.height = 600;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Hintergrund
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = "#000000";
		ctx.font = "bold 24px Arial";
		ctx.fillText("Kinklist", 20, 40);

		// Legende zeichnen
		ctx.font = "16px Arial";
		const levels = ["Not Entered", "Favorite", "Like", "Okay", "Maybe", "No"];
		const colors = ["#FFFFFF", "#6DB5FE", "#23FD22", "#FDFD6B", "#DB6C00", "#920000"];
		levels.forEach((level, index) => {
			const x = 20 + index * 120;
			ctx.fillStyle = colors[index];
			ctx.beginPath();
			ctx.arc(x, 70, 8, 0, 2 * Math.PI);
			ctx.fill();
			ctx.strokeStyle = "#000000"; 
			ctx.stroke();
			ctx.fillStyle = "#000000";
			ctx.fillText(level, x - 20, 100);
		});

		// Liste der Kategorien und Kinks zeichnen
		let y = 130;
		this.categories.forEach(category => {
			ctx.font = "bold 18px Arial";
			ctx.fillText(category.name, 20, y);
			y += 25;
			category.kinks.forEach(kink => {
				ctx.font = "14px Arial";
				ctx.fillText("- " + kink, 40, y);
				y += 20;
			});
			y += 15;
		});

		// Hochladen zu Imgur
		const imgurClientId = '9db53e5936cd02f';
		const base64Image = canvas.toDataURL().split(",")[1];
		fetch("https://api.imgur.com/3/image", {
			method: "POST",
			headers: {
				Authorization: "Client-ID " + imgurClientId,
				Accept: "application/json",
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ image: base64Image, type: "base64" })
		}).then(response => response.json())
		.then(result => {
			if (result.success) {
				alert("Exportiert! Bild URL: " + "https://i.imgur.com/" + result.data.id + ".png");
			} else {
				alert("Export fehlgeschlagen!");
			}
		}).catch(() => {
			alert("Export fehlgeschlagen!");
		});
	}

	// Zeigt ein Bearbeitungs-Overlay, um den Kink-Text zu editieren.
	private showEditOverlay(): void {
		let overlay = document.getElementById("edit-overlay");
		if (!overlay) {
			overlay = document.createElement("div");
			overlay.id = "edit-overlay";
			overlay.style.position = "fixed";
			overlay.style.top = "0";
			overlay.style.left = "0";
			overlay.style.right = "0";
			overlay.style.bottom = "0";
			overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
			overlay.style.display = "flex";
			overlay.style.alignItems = "center";
			overlay.style.justifyContent = "center";

			const modal = document.createElement("div");
			modal.style.backgroundColor = "#fff";
			modal.style.padding = "20px";
			modal.style.width = "80%";
			modal.style.maxWidth = "600px";

			const textarea = document.createElement("textarea");
			textarea.id = "edit-textarea";
			textarea.style.width = "100%";
			textarea.style.height = "300px";
			textarea.value = this.categoriesToText();
			modal.appendChild(textarea);

			const btnAccept = document.createElement("button");
			btnAccept.textContent = "Accept";
			btnAccept.addEventListener("click", () => {
				const newText = (document.getElementById("edit-textarea") as HTMLTextAreaElement).value;
				const newCats = this.parseCategoriesText(newText);
				if (newCats) {
					this.categories = newCats;
					this.render();
					this.bindEvents();
					this.restoreFromHash();
					overlay!.style.display = "none";
				} else {
					alert("Fehler beim Parsen des Textes.");
				}
			});
			modal.appendChild(btnAccept);

			const btnCancel = document.createElement("button");
			btnCancel.textContent = "Cancel";
			btnCancel.addEventListener("click", () => {
				overlay!.style.display = "none";
			});
			modal.appendChild(btnCancel);

			overlay.appendChild(modal);
			document.body.appendChild(overlay);
		} else {
			(overlay.querySelector("#edit-textarea") as HTMLTextAreaElement).value = this.categoriesToText();
			overlay.style.display = "flex";
		}
	}

	// Wandelt die aktuellen Kategorien in einen editierbaren Text um.
	private categoriesToText(): string {
		let text = "";
		this.categories.forEach(cat => {
			text += "#" + cat.name + "\n";
			text += "(" + cat.fields.join(", ") + ")\n";
			cat.kinks.forEach(kink => { text += "* " + kink + "\n"; });
			text += "\n";
		});
		return text;
	}

	// Parst den textbasierten Kink-Input und gibt ein Array von KinkCategory zurück.
	private parseCategoriesText(text: string): KinkCategory[] | null {
		const lines = text.replace(/\r/g, "").split("\n");
		const categories: KinkCategory[] = [];
		let currentCat: KinkCategory | null = null;
		lines.forEach(line => {
			line = line.trim();
			if (!line) return;
			if (line.startsWith("#")) {
				if (currentCat) categories.push(currentCat);
				currentCat = { name: line.substring(1).trim(), fields: [], kinks: [] };
			} else if (line.startsWith("(") && currentCat) {
				const fields = line.substring(1, line.length - 1).split(",");
				currentCat.fields = fields.map(f => f.trim());
			} else if (line.startsWith("*") && currentCat) {
				currentCat.kinks.push(line.substring(1).trim());
			}
		});
		if (currentCat) categories.push(currentCat);
		return (categories.length > 0 ? categories : null);
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
