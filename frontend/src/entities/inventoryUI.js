import Functions from "../assets/utils/functions.js";
import itemsList from "./itemslist.js";
import defaultTextStyle from "../assets/utils/functions.js";

export default class InventoryUI {
	constructor(scene, inventory) {
		this.scene = scene;
		this.inventory = inventory;

		this.iconScale = 1; // Icon-Größe anpassen
		this.container = this.scene.add.container(window.innerWidth / 2 - 175, 150).setDepth(9999);

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

			// Drop-Menge Feld
			let dropAmount = 1;
			const dropInput = this.scene.add.text(255, y + 10, dropAmount.toString(), { fontSize: "16px", color: "#000000ff" }).setOrigin(0.5);

			// Pfeile
			const minusArrow = this.scene.add
				.text(235, y + 5, "-", { fontSize: "16px", color: "#ff5555" })
				.setInteractive()
				.on("pointerdown", () => {
					dropAmount = Math.max(1, dropAmount - 1);
					dropInput.setText(dropAmount.toString());
				});

			const plusArrow = this.scene.add
				.text(265, y + 5, "+", { fontSize: "16px", color: "#00aa00" })
				.setInteractive()
				.on("pointerdown", () => {
					dropAmount = Math.min(item.quantity, dropAmount + 1);
					dropInput.setText(dropAmount.toString());
				});

			// Drop Button
			const dropBtn = this.scene.add
				.text(285, y + 5, "Drop", { fontSize: "16px", color: "#ff0000" })
				.setInteractive()
				.on("pointerdown", () => {
					if (this.inventory.dropItem) {
						this.inventory.dropItem(this.inventory.inventory_id, item, dropAmount);
						this.scene.sound.play("drop");
					}
				});

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
			this.container.setVisible(false);
		} else {
			this.refresh();
			this.container.setVisible(true);
		}
	}

	hide() {
		this.container.setVisible(false);
		this.popup.setVisible(false);
	}
}
