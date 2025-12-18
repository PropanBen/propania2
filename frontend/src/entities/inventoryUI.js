import Functions from "../assets/utils/functions.js";
import itemsList from "./itemslist.js";

export default class InventoryUI {
	constructor(scene, inventory) {
		this.scene = scene;
		this.inventory = inventory;

		this.updateDimensions();

		this.container = this.scene.add.container(this.left, this.top).setDepth(9999);

		// Hintergrund und Rahmen
		this.bg = this.scene.add.rectangle(0, 0, this.width, this.height, 0xdeb887, 0.8).setOrigin(0);
		this.border = this.scene.add.rectangle(0, 0, this.width, this.height).setStrokeStyle(3, 0x000000).setOrigin(0);
		this.title = this.scene.add.text(this.padding, this.padding, "Inventory", {
			fontSize: Math.floor(24 * this.iconScale) + "px",
			fontStyle: "bold",
			color: "#000000ff",
		});

		// Close Button
		this.closeBtn = this.scene.add
			.text(this.width - this.padding - 30, this.padding, "X", {
				fontSize: Math.floor(32 * this.iconScale) + "px",
				fontStyle: "bold",
				color: "#ff4444",
			})
			.setInteractive()
			.on("pointerdown", () => this.hide());

		this.itemList = this.scene.add.container(this.padding, this.padding + 40);

		this.container.add([this.bg, this.border, this.title, this.closeBtn, this.itemList]);
		this.container.setVisible(false);

		this.enableDragging(this.container);
		this.createPopup();

		window.addEventListener("resize", () => this.resize());
	}

	updateDimensions() {
		this.width = window.innerWidth * 0.8;
		this.height = window.innerHeight * 0.8;
		this.left = (window.innerWidth - this.width) / 2;
		this.top = (window.innerHeight - this.height) / 2;
		this.iconScale = Math.min(this.width / 600, this.height / 400);
		this.padding = 10;
	}

	enableDragging(container) {
		container.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.width, this.height), Phaser.Geom.Rectangle.Contains);
		this.scene.input.setDraggable(container);
		container.on("drag", (pointer, dragX, dragY) => {
			container.x = dragX;
			container.y = dragY;
			if (this.popup) this.centerPopup();
		});
	}

	createPopup() {
		this.popupWidth = this.width * 0.5;
		this.popupHeight = this.height * 0.3;

		this.popup = this.scene.add.container(0, 0).setDepth(10000);

		const bg = this.scene.add.rectangle(0, 0, this.popupWidth, this.popupHeight, 0xdeb887, 0.9).setOrigin(0.5);
		const border = this.scene.add.rectangle(0, 0, this.popupWidth, this.popupHeight).setStrokeStyle(3, 0x000000).setOrigin(0.5);

		this.popupText = this.scene.add.text(-this.popupWidth / 2 + 10, -this.popupHeight / 2 + 10, "", {
			fontSize: Math.floor(20 * this.iconScale) + "px",
			fontStyle: "bold",
			color: "#000000ff",
			wordWrap: { width: this.popupWidth - 20 },
		});

		this.popupPriceText = this.scene.add.text(-this.popupWidth / 2 + 10, this.popupHeight / 2 - 40, "", {
			fontSize: Math.floor(20 * this.iconScale) + "px",
			fontStyle: "bold",
			color: "#000000ff",
			wordWrap: { width: this.popupWidth - 20 },
		});

		const closeBtn = this.scene.add
			.text(this.popupWidth / 2 - 30, -this.popupHeight / 2 + 10, "X", {
				fontSize: Math.floor(24 * this.iconScale) + "px",
				fontStyle: "bold",
				color: "#ff4444",
			})
			.setInteractive()
			.on("pointerdown", () => this.popup.setVisible(false));

		this.popup.add([bg, border, this.popupText, this.popupPriceText, closeBtn]);
		this.popup.setVisible(false);
	}

	centerPopup() {
		if (!this.container || !this.popup) return;
		this.popup.x = this.container.x + this.width / 2;
		this.popup.y = this.container.y + this.height / 2;
	}

	refresh() {
		if (!this.inventory || !this.inventory.items) return;

		this.itemList.removeAll(true);
		let y = 0;
		const itemHeight = 50 * this.iconScale;
		const iconSize = itemHeight - 10;

		const controlsX = this.width - 300; // Abstand für Controls rechts

		this.inventory.items.forEach((item) => {
			const frameIndex = Functions.getFrameFromItemListWithKey(item.key, itemsList);

			// Icon links
			const icon = this.scene.add
				.sprite(this.padding + iconSize / 2, y + iconSize / 2 + 30, "items", frameIndex)
				.setDisplaySize(iconSize, iconSize)
				.setInteractive()
				.on("pointerdown", () => this.showDescription(item));

			// Name rechts neben Icon
			const name = this.scene.add.text(this.padding + iconSize + 10, y + 30, item.name, {
				fontSize: Math.floor(20 * this.iconScale) + "px",
				fontStyle: "bold",
				color: "#0099ffff",
			});
			name.setInteractive().on("pointerdown", () => this.showDescription(item));

			// Quantity Text, Drop Input und Buttons rechts
			const quantityText = this.scene.add.text(controlsX - 200, y + 30, `x${item.quantity}`, {
				fontSize: Math.floor(20 * this.iconScale) + "px",
				fontStyle: "bold",
				color: "#000000ff",
			});

			if (!item.dropAmount) item.dropAmount = 1;

			const dropInput = this.scene.add
				.text(controlsX, y + 45, item.dropAmount.toString(), {
					fontSize: Math.floor(20 * this.iconScale) + "px",
					fontStyle: "bold",
					color: "#000000ff",
				})
				.setOrigin(0.5);

			// Minus Icon
			const minusArrow = this.scene.add
				.sprite(controlsX - 100, y + itemHeight / 2, "minus_red")
				.setDisplaySize(itemHeight * 0.6, itemHeight * 0.6)
				.setInteractive()
				.on("pointerdown", () => {
					if (item.dropAmount <= 1) item.dropAmount = item.quantity;
					else item.dropAmount = Math.max(1, item.dropAmount - 1);
					dropInput.setText(item.dropAmount.toString());
				});

			// Plus Icon
			const plusArrow = this.scene.add
				.sprite(controlsX + 100, y + itemHeight / 2, "plus_green")
				.setDisplaySize(itemHeight * 0.6, itemHeight * 0.6)
				.setInteractive()
				.on("pointerdown", () => {
					item.dropAmount = Math.min(item.quantity, item.dropAmount + 1);
					dropInput.setText(item.dropAmount.toString());
				});

			let dropBtn = this.scene.add
				.text(controlsX + 150, y + 30, this.inventory.type === "buy" ? "Buy" : this.inventory.type === "sell" ? "Sell" : "Drop", {
					fontSize: Math.floor(20 * this.iconScale) + "px",
					fontStyle: "bold",
					color: "#ff0000",
				})
				.setInteractive()
				.on("pointerdown", () => {
					if (this.inventory.type === "drop") this.inventory.dropItem(this.inventory.inventory_id, item, item.dropAmount);
					if (this.inventory.type === "buy") this.inventory.buyItem(this.inventory.inventory_id, item.item_id, item.dropAmount);
					if (this.inventory.type === "sell") this.inventory.sellItem(this.inventory.inventory_id, item.item_id, item.dropAmount);
				});

			this.itemList.add([icon, name, quantityText, dropInput, minusArrow, plusArrow, dropBtn]);
			y += itemHeight;
		});
	}

	showDescription(item) {
		const description = itemsList.find((i) => i.key === item.key)?.description || "No description";
		const price = itemsList.find((i) => i.key === item.key)?.price || "No price";
		this.popupText.setText(description);
		this.popupPriceText.setText("Price: " + price);
		this.centerPopup();
		this.popup.setVisible(true);
	}

	toggle() {
		if (this.container.visible) this.container.setVisible(false);
		else this.container.setVisible(true);
		this.refresh();
	}

	hide() {
		this.container.setVisible(false);
		this.popup.setVisible(false);
	}

	resize() {
		this.updateDimensions();
		this.container.x = this.left;
		this.container.y = this.top;

		if (this.bg) {
			this.bg.width = this.width;
			this.bg.height = this.height;
		}
		if (this.border) {
			this.border.width = this.width;
			this.border.height = this.height;
		}
		if (this.closeBtn) this.closeBtn.x = this.width - this.padding - 30;

		this.refresh();

		if (this.popup) {
			this.popupWidth = this.width * 0.5;
			this.popupHeight = this.height * 0.3;
			this.popup.getAt(0).width = this.popupWidth;
			this.popup.getAt(0).height = this.popupHeight;
			this.popup.getAt(1).width = this.popupWidth;
			this.popup.getAt(1).height = this.popupHeight;
			this.centerPopup();
		}
	}

	setPosition(x, y) {
		if (this.container) {
			this.container.x = x;
			this.container.y = y;
		}
		if (this.popup) this.centerPopup();
	}

	destroy() {
		if (this.container) {
			this.container.removeAll(true);
			this.container.destroy();
			this.container = null;
		}
		if (this.popup) {
			this.popup.removeAll(true);
			this.popup.destroy();
			this.popup = null;
		}
		this.inventory = null;
		this.scene = null;
		this.itemList = null;
		this.popupText = null;
		this.popupPriceText = null;
	}
}
