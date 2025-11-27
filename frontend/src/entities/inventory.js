import Functions from "../assets/utils/functions.js";
import itemsList from "./itemslist";
import defaultTextStyle from "../assets/utils/functions.js";

// src/entities/inventory.js
export default class Inventory {
	constructor(scene, capacity = 20, player = null) {
		this.scene = scene;
		this.capacity = capacity;
		this.player = player;

		this.items = [];
		this.visible = false;

		this.uiScene = null;
		this.container = null;
		this.containerbg = null;

		this.itemsImages = [];
		this.itemTexts = [];
		this.itemButtons = [];
		this.emptyText = null; // für "Empty"-Anzeige
		this.cancelButton = null;

		this.dragOffset = { x: 0, y: 0 };
		this.currentPopup = null; // nur ein Popup gleichzeitig

		// Konfiguration
		this.containerWidth = 300;
		this.itemHeight = 40;
		this.paddingTop = 10;
		this.paddingBottom = 10;
		this.defaultHeight = 200; // wenn keine Items da sind
	}

	initUI(uiScene) {
		this.uiScene = uiScene;

		// Hintergrund
		this.containerbg = uiScene.add.graphics();

		// Container
		this.container = uiScene.add.container(window.innerWidth / 2 - 150, window.innerHeight / 2 - 200, [this.containerbg]).setDepth(1000);
		this.container.setVisible(this.visible);

		// Cancel Button
		this.cancelButton = uiScene.add
			.sprite(this.containerWidth - 10, 10, "cancel")
			.setScale(2)
			.setInteractive({ useHandCursor: true })
			.setDepth(1001);
		this.cancelButton.on("pointerdown", () => {
			this.toggleUI();
		});
		this.container.add(this.cancelButton);

		// Interaktivität
		this.containerbg.setInteractive(
			new Phaser.Geom.Rectangle(0, 0, this.containerWidth, this.defaultHeight),
			Phaser.Geom.Rectangle.Contains
		);
		uiScene.input.setDraggable(this.containerbg);

		uiScene.input.on("dragstart", (pointer, gameObject) => {
			if (gameObject === this.containerbg) {
				this.dragOffset.x = pointer.x - this.container.x;
				this.dragOffset.y = pointer.y - this.container.y;
			}
		});

		uiScene.input.on("drag", (pointer, gameObject) => {
			if (gameObject === this.containerbg) {
				this.container.x = pointer.x - this.dragOffset.x;
				this.container.y = pointer.y - this.dragOffset.y;
			}
		});

		//	this.refreshUI();
	}

	setFromServer(payload) {
		if (payload?.capacity) this.capacity = payload.capacity;

		this.items = (payload?.items ?? []).map((item) => {
			const itemData = itemsList.find((i) => i.key === item.key) || {};
			return {
				...item,
				itemFrame: item.itemFrame ?? itemData.frame ?? 0,
				description: item.description ?? itemData.description ?? "",
				price: item.price ?? itemData.price ?? 0,
			};
		});

		//this.refreshUI();
	}

	toggleUI() {
		if (!this.container) return;
		this.visible = !this.visible;
		this.container.setVisible(this.visible);
		this.refreshUI();
	}

	refreshUI() {
		//if (this.player) this.player.currenthealth = 99;
		//	if (this.player) this.player.money = 5;
		//	if (this.player) this.player.exp = 100;
		//	if (this.player) this.player.level = 15;
		if (!this.container || !this.uiScene) return;

		// Alte UI-Elemente entfernen
		this.itemsImages.forEach((o) => o.destroy());
		this.itemTexts.forEach((o) => o.destroy());
		this.itemButtons.forEach((o) => o.destroy());
		if (this.emptyText) {
			this.emptyText.destroy();
			this.emptyText = null;
		}

		this.itemsImages = [];
		this.itemTexts = [];
		this.itemButtons = [];

		let containerHeight;
		if (this.items.length === 0) {
			containerHeight = this.defaultHeight;
		} else {
			containerHeight = this.items.length * this.itemHeight + this.paddingTop + this.paddingBottom;
		}

		// Hintergrund neu zeichnen
		this.containerbg.clear();
		this.containerbg.fillStyle(0xdeb887, 0.8);
		this.containerbg.fillRoundedRect(0, 0, this.containerWidth, containerHeight, 10);
		this.containerbg.lineStyle(2, 0x000000, 1);
		this.containerbg.strokeRoundedRect(0, 0, this.containerWidth, containerHeight, 10);

		if (this.items.length === 0) {
			// "Empty"-Text zentrieren
			this.emptyText = this.uiScene.add
				.text(this.containerWidth / 2, containerHeight / 2, "Empty", Functions.defaultTextStyle)
				.setOrigin(0.5);
			this.container.add(this.emptyText);
		} else {
			// Items zeichnen
			this.items.forEach((it, idx) => {
				const yPos = this.paddingTop + idx * this.itemHeight + this.itemHeight / 2;

				// Bild
				const img = this.uiScene.add.image(20, yPos, "items", it.itemFrame).setScale(0.9).setOrigin(0.5);
				this.container.add(img);
				this.itemsImages.push(img);

				// Name Text interaktiv
				const txt = this.uiScene.add.text(50, yPos - 10, `${it.name}`, Functions.defaultTextStyle).setInteractive({ useHandCursor: true });

				this.container.add(txt);
				this.itemTexts.push(txt);

				txt.on("pointerdown", () => {
					this.showItemPopup(it);
				});

				// Quantity Text
				const quantity = this.uiScene.add.text(200, yPos - 10, `x${it.quantity}`, Functions.defaultTextStyle);
				this.container.add(quantity);
				this.itemTexts.push(quantity);

				// Button (Drop)
				const btn = this.uiScene.add.sprite(260, yPos, "arrow_down").setScale(1.8).setInteractive({ useHandCursor: true });
				btn.removeAllListeners();
				btn.on("pointerdown", () => {
					if (!this.scene) {
						console.warn("Inventory: scene ist undefined → tryDrop kann nicht ausgeführt werden.");
						return;
					}
					this.scene.tryDrop(it);
				});
				this.container.add(btn);
				this.itemButtons.push(btn);
			});
		}
	}

	showItemPopup(item) {
		if (!this.uiScene) return;

		// Vorheriges Popup schließen
		if (this.currentPopup) {
			this.currentPopup.destroy();
			this.currentPopup = null;
		}

		// Popup Container
		const popupWidth = 250;
		const popupHeight = 150;
		const popup = this.uiScene.add.container(window.innerWidth / 2 - popupWidth / 2, window.innerHeight / 2 - popupHeight / 2 + 20);
		popup.setDepth(2000);

		// Hintergrund
		const bg = this.uiScene.add.graphics();
		bg.fillStyle(0xdeb887, 0.8);
		bg.fillRoundedRect(0, 0, popupWidth, popupHeight, 10);
		bg.lineStyle(2, 0x000000, 1);
		bg.strokeRoundedRect(0, 0, popupWidth, popupHeight, 10);
		popup.add(bg);

		// Interaktivität und Drag
		bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, popupWidth, popupHeight), Phaser.Geom.Rectangle.Contains);
		this.uiScene.input.setDraggable(bg);

		let dragOffset = { x: 0, y: 0 };
		this.uiScene.input.on("dragstart", (pointer, gameObject) => {
			if (gameObject === bg) {
				dragOffset.x = pointer.x - popup.x;
				dragOffset.y = pointer.y - popup.y;
			}
		});
		this.uiScene.input.on("drag", (pointer, gameObject) => {
			if (gameObject === bg) {
				popup.x = pointer.x - dragOffset.x;
				popup.y = pointer.y - dragOffset.y;
			}
		});

		// Cancel Button (wie beim Containerbg)
		const cancelBtn = this.uiScene.add
			.sprite(popupWidth - 10, 10, "cancel")
			.setScale(2)
			.setInteractive({ useHandCursor: true });
		cancelBtn.on("pointerdown", () => {
			popup.destroy();
			this.currentPopup = null;
		});
		popup.add(cancelBtn);

		// Text Description
		const descText = this.uiScene.add.text(10, 10, `Description:\n${item.description || "No description"}`, Functions.defaultTextStyle);
		popup.add(descText);

		// Text Price
		const priceText = this.uiScene.add.text(10, popupHeight - 40, `Price: ${item.price ?? 0}`, Functions.defaultTextStyle);
		popup.add(priceText);

		this.currentPopup = popup;
		this.uiScene.add.existing(popup);
	}

	setInventoryPosition(x, y) {
		if (this.container) {
			this.container.setPosition(x, y);
		}
	}
}
