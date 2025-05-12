import { strToClass } from "./Utils";

export interface KinkCategory {
	name: string;
	fields: string[];
	kinks: string[];
}

export class KinkEditor {
	private container: HTMLElement;
	private categories: KinkCategory[] = [];
	private editOverlay!: HTMLDivElement; // neues Overlay

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

		// Edit-Button hinzufügen
		const editBtn = document.createElement("button");
		editBtn.id = "edit-btn";
		editBtn.textContent = "Edit";
		this.container.appendChild(editBtn);

		// Overlay für das Editieren einfügen
		this.editOverlay = document.createElement("div");
		this.editOverlay.id = "edit-overlay";
		this.editOverlay.style.position = "fixed";
		this.editOverlay.style.top = "0";
		this.editOverlay.style.left = "0";
		this.editOverlay.style.right = "0";
		this.editOverlay.style.bottom = "0";
		this.editOverlay.style.backgroundColor = "rgba(0,0,0,0.8)";
		this.editOverlay.style.display = "none";
		const overlayContent = document.createElement("div");
		overlayContent.style.position = "absolute";
		overlayContent.style.top = "50%";
		overlayContent.style.left = "50%";
		overlayContent.style.transform = "translate(-50%, -50%)";
		overlayContent.style.backgroundColor = "#fff";
		overlayContent.style.padding = "20px";
		const textarea = document.createElement("textarea");
		textarea.id = "kinks-text";
		textarea.style.width = "500px";
		textarea.style.height = "300px";
		textarea.value = this.getKinksText();
		overlayContent.appendChild(textarea);
		const acceptBtn = document.createElement("button");
		acceptBtn.id = "accept-btn";
		acceptBtn.textContent = "Accept";
		overlayContent.appendChild(acceptBtn);
		this.editOverlay.appendChild(overlayContent);
		document.body.appendChild(this.editOverlay);
	}

	private bindEvents(): void {
		// Beispielhafte Event-Bindung für den Export-Button
		const exportBtn = document.getElementById("export-btn");
		if (exportBtn) {
			exportBtn.addEventListener("click", () => this.exportKinkList());
		}

		// Edit-Button Event
		const editBtn = document.getElementById("edit-btn");
		if (editBtn) {
			editBtn.addEventListener("click", () => {
				const textarea = document.getElementById("kinks-text") as HTMLTextAreaElement;
				if (textarea) {
					textarea.value = this.getKinksText();
				}
				this.editOverlay.style.display = "block";
			});
		}

		// Accept im Overlay Event
		const acceptBtn = document.getElementById("accept-btn");
		if (acceptBtn) {
			acceptBtn.addEventListener("click", () => {
				const textarea = document.getElementById("kinks-text") as HTMLTextAreaElement;
				if (textarea) {
					this.categories = this.parseKinksText(textarea.value);
					this.render();
				}
				this.editOverlay.style.display = "none";
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

	private exportKinkList(): void {
		const username = prompt("Please enter your name") || "";
		if (!username) return;
		// Canvas erstellen
		const canvas = document.createElement("canvas");
		canvas.width = 800;
		canvas.height = 600;
		const context = canvas.getContext("2d");
		if (!context) return;
		// Hintergrund & Header zeichnen
		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.fillStyle = "#000000";
		context.font = "24px Arial";
		context.fillText(`Kinklist (${username})`, 20, 40);
		// Legende zeichnen
		const levels = ["Not Entered", "Favorite", "Like", "Okay", "Maybe", "No"];
		const colors = [
			"#FFFFFF",
			"#6DB5FE",
			"#23FD22",
			"#FDFD6B",
			"#DB6C00",
			"#920000",
		];
		levels.forEach((lvl, i) => {
			context.fillStyle = colors[i];
			context.beginPath();
			context.arc(100 + i * 100, 80, 10, 0, 2 * Math.PI);
			context.fill();
			context.fillStyle = "#000000";
			context.fillText(lvl, 90 + i * 100, 110);
		});
		// Kategorien und Kinks zeichnen
		let yPos = 140;
		this.categories.forEach(category => {
			context.font = "20px Arial";
			context.fillText(category.name, 20, yPos);
			yPos += 30;
			category.kinks.forEach(kink => {
				context.font = "16px Arial";
				context.fillText(`- ${kink}`, 40, yPos);
				yPos += 25;
			});
			yPos += 20;
		});
		// Bilddaten extrahieren
		const dataURL = canvas.toDataURL("image/png");

		// Bild zu Imgur hochladen
		const clientId = "9db53e5936cd02f"; // Imgur Client ID
		fetch("https://api.imgur.com/3/image", {
			method: "POST",
			headers: {
				Authorization: `Client-ID ${clientId}`,
				Accept: "application/json"
			},
			body: new URLSearchParams({
				image: dataURL.split(",")[1],
				type: "base64"
			})
		})
			.then(response => response.json())
			.then(result => {
				if (result && result.data && result.data.id) {
					const url = `https://i.imgur.com/${result.data.id}.png`;
					alert(`Image URL: ${url}`);
				} else {
					alert("Upload failed");
				}
			})
			.catch(() => {
				alert("Upload failed - could not connect");
			});
	}

	// Serialisiert die Kink-Daten in einen Text (ähnlich der ursprünglichen Textdatei)
	private getKinksText(): string {
		let text = "";
		this.categories.forEach(category => {
			text += `#${category.name}\n`;
			text += `(${category.fields.join(", ")})\n`;
			category.kinks.forEach(kink => {
				text += `* ${kink}\n`;
			});
			text += "\n";
		});
		return text;
	}

	// Parst den Text in ein Array von KinkCategory
	private parseKinksText(text: string): KinkCategory[] {
		const lines = text.replace(/\r/g, "").split("\n");
		const categories: KinkCategory[] = [];
		let currentCategory: Partial<KinkCategory> = {};
		lines.forEach(line => {
			if (!line.trim()) return;
			if (line.startsWith("#")) {
				if (currentCategory.name) {
					categories.push(currentCategory as KinkCategory);
				}
				currentCategory = { name: line.substring(1).trim(), fields: [], kinks: [] };
			} else if (line.startsWith("(")) {
				const fieldsStr = line.substring(1, line.length - 1);
				currentCategory.fields = fieldsStr.split(",").map(s => s.trim());
			} else if (line.startsWith("*")) {
				currentCategory.kinks?.push(line.substring(1).trim());
			}
		});
		if (currentCategory.name) {
			categories.push(currentCategory as KinkCategory);
		}
		return categories;
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
