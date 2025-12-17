import Functions from "../assets/utils/functions.js";
import itemsList from "./itemslist.js";

export default class InventoryUI {
	constructor(scene, inventory) {
		this.scene = scene;
		this.inventory = inventory;

		this.iconScale = 1; // Icon-Größe anpassen
		this.container = this.scene.add.container(window.innerWidth / 2 - 175, 400).setDepth(9999);

		// Hintergrund und Rahmen
		const bg = this.scene.add.rectangle(0, 0, 350, 400, 0xdeb887, 0.8).setOrigin(0);
		const border = this.scene.add.rectangle(0, 0, 350, 400).setStrokeStyle(2, 0x000000).setOrigin(0);
		const title = this.scene.add.text(10, 10, "Inventory", { fontSize: "18px", color: "#000000ff" });

		// Close Button
		const closeBtn = this.scene.add
			.text(320, 10, "X", { fontSize: "22px", color: "#ff4444" })
			.setInteractive()
			.on("pointerdown", () => this.hide());

		this.itemList = this.scene.add.container(10, 50);
		this.container.add([bg, border, title, closeBtn, this.itemList]);
		this.container.setVisible(false);

		// Drag & Drop für das Inventar
		this.enableDragging(this.container);

		// Popup für Item-Description
		this.createPopup();
	}

	// Drag & Drop
	enableDragging(container) {
		container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 400, 400), Phaser.Geom.Rectangle.Contains);
		this.scene.input.setDraggable(container);
		container.on("drag", (pointer, dragX, dragY) => {
			container.x = dragX;
			container.y = dragY;
		});
	}

	// Popup erstellen
	createPopup() {
		this.popup = this.scene.add.container(300, 200).setDepth(10000);
		const bg = this.scene.add.rectangle(0, 0, 260, 150, 0xdeb887, 0.8).setOrigin(0);
		const border = this.scene.add.rectangle(0, 0, 260, 150).setStrokeStyle(2, 0x000000).setOrigin(0);
		this.popupText = this.scene.add.text(10, 10, "", { fontSize: "16px", color: "#000000ff", wordWrap: { width: 240 } });
		this.popupPriceText = this.scene.add.text(10, 120, "", { fontSize: "16px", color: "#000000ff", wordWrap: { width: 240 } });
		const closeBtn = this.scene.add
			.text(230, 5, "X", { fontSize: "20px", color: "#ff4444" })
			.setInteractive()
			.on("pointerdown", () => this.popup.setVisible(false));

		this.popup.add([bg, border, this.popupText, this.popupPriceText, closeBtn]);
		this.popup.setVisible(false);
		this.enableDragging(this.popup);
	}

	// Inventarliste aktualisieren
	refresh() {
		if (!this.inventory || !this.inventory.items) return;

		this.itemList.removeAll(true);
		let y = 0;

		this.inventory.items.forEach((item) => {
			const frameIndex = Functions.getFrameFromItemListWithKey(item.key, itemsList);

			// Icon
			const icon = this.scene.add
				.sprite(10, y + 10, "items", frameIndex)
				.setScale(this.iconScale)
				.setInteractive()
				.on("pointerdown", () => this.showDescription(item));

			// Name
			const name = this.scene.add.text(50, y + 5, item.name, { fontSize: "16px", color: "#0099ffff" });
			name.setInteractive().on("pointerdown", () => this.showDescription(item));

			// Menge Text
			const quantityText = this.scene.add.text(200, y + 5, `x${item.quantity}`, { fontSize: "16px", color: "#000000ff" });

			// Standard Drop-Menge
			if (!item.dropAmount) item.dropAmount = 1;

			const dropInput = this.scene.add
				.text(255, y + 10, item.dropAmount.toString(), { fontSize: "16px", color: "#000000ff" })
				.setOrigin(0.5);

			// Minus-Button springt auf maximale Menge
			const minusArrow = this.scene.add
				.text(235, y + 5, "-", { fontSize: "16px", color: "#ff5555" })
				.setInteractive()
				.on("pointerdown", () => {
					if (item.dropAmount <= 1) {
						// Springe auf maximale Menge
						item.dropAmount = item.quantity;
					} else {
						// Normalerweise 1 abziehen
						item.dropAmount = Math.max(1, item.dropAmount - 1);
					}
					dropInput.setText(item.dropAmount.toString());
				});

			// Plus-Button wie bisher
			const plusArrow = this.scene.add
				.text(265, y + 5, "+", { fontSize: "16px", color: "#00aa00" })
				.setInteractive()
				.on("pointerdown", () => {
					item.dropAmount = Math.min(item.quantity, item.dropAmount + 1);
					dropInput.setText(item.dropAmount.toString());
				});

			let dropBtn = this.scene.add
				.text(285, y + 5, "Drop", { fontSize: "16px", color: "#ff0000" })
				.setInteractive()
				.on("pointerdown", () => {
					if (this.inventory.type === "drop") {
						this.inventory.dropItem(this.inventory.inventory_id, item, item.dropAmount);
						this.scene.sound.play("drop");
					}
				});

			if (this.inventory.type === "buy") {
				dropBtn
					.setText("Buy")
					.removeAllListeners()
					.on("pointerdown", () => {
						this.inventory.buyItem(this.inventory.inventory_id, item.item_id, item.dropAmount);
					});
			}

			if (this.inventory.type === "sell") {
				dropBtn
					.setText("Sell")
					.removeAllListeners()
					.on("pointerdown", () => {
						this.inventory.sellItem(this.inventory.inventory_id, item.item_id, item.dropAmount);
					});
			}

			this.itemList.add([icon, name, quantityText, minusArrow, dropInput, plusArrow, dropBtn]);
			y += 40;
		});
	}

	// Popup anzeigen
	showDescription(item) {
		const description = itemsList.find((i) => i.key === item.key)?.description || "No description";
		const price = itemsList.find((i) => i.key === item.key)?.price || "No price";
		this.popupText.setText(description);
		this.popupPriceText.setText("Price: " + price);
		this.popup.setVisible(true);
	}

	// Inventar sichtbar / unsichtbar
	toggle() {
		if (this.container.visible) {
			this.inventory.type = "drop";
			this.container.setVisible(false);
		} else {
			this.container.setVisible(true);
		}
		this.refresh();
	}

	hide() {
		this.container.setVisible(false);
		this.popup.setVisible(false);
	}

	setPosition(x, y, adjustPopup = true) {
		this.x = x;
		this.y = y;

		if (this.container) {
			this.container.x = x;
			this.container.y = y;
		}

		if (adjustPopup && this.popup) {
			this.popup.x = x + 300; // Beispiel: rechts neben Inventar
			this.popup.y = y + 50; // leicht nach unten verschoben
		}
	}

	destroy() {
		// Alle Kinder des Haupt-Containers entfernen
		if (this.container) {
			this.container.removeAll(true);
			this.container.destroy();
			this.container = null;
		}

		// Popup zerstören
		if (this.popup) {
			this.popup.removeAll(true);
			this.popup.destroy();
			this.popup = null;
		}

		// Referenzen auf Inventar und Szene löschen
		this.inventory = null;
		this.scene = null;
		this.itemList = null;
		this.popupText = null;
		this.popupPriceText = null;
	}
}
