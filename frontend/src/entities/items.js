import Phaser from "phaser";
import itemsList from "../entities/itemslist.js";

export default class Item extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, info) {
		// Suche Item in der Liste, um den Frame zu erhalten
		const itemData = itemsList.find((item) => item.key === info.key);

		if (!itemData) {
			console.warn(`Item key "${info.key}" nicht in itemslist.js gefunden.`);
		}

		super(scene, info.x, info.y, "items", itemData?.frame ?? 0);

		this.scene = scene;
		this.world_item_id = info.id;
		this.item_id = info.item_id;
		this.item_key = info.key;
		this.name = info.name ?? itemData?.name ?? "Unknown";
		this.description = itemData?.description ?? "";
		this.quantity = info.quantity ?? 1;
		this.itemFrame = itemData?.frame ?? 0;
		this.price = itemData?.price ?? 0;
		this.setFrame(this.itemFrame);

		scene.add.existing(this);
		scene.physics.add.existing(this, true);
		this.body.setSize(16, 16);
		this.setDepth(11);
		this.setScale(0.5);

		this.quantityText = scene.add
			.text(this.x + 15, this.y + 5, this.quantity + "x", { fontSize: "10px", fontStyle: "bold", color: "#000000ff", resolution: 4 })
			.setOrigin(0.5);
		this.quantityText.setDepth(1000);
	}

	normalizeSize(targetWidth, targetHeight) {
		const scaleX = targetWidth / this.width;
		const scaleY = targetHeight / this.height;
		const scale = Math.min(scaleX, scaleY);
		this.setScale(scale);
		this.body.setSize(this.width * scale, this.height * scale);
		this.body.setOffset((this.width - this.width * scale) / 2, (this.height - this.height * scale) / 2);
	}

	setPosition(x, y) {
		super.setPosition(x, y);
		if (this.nameText) this.nameText.setPosition(x, y - 18);
		return this;
	}

	destroy(fromScene) {
		if (this.quantityText) {
			this.quantityText.destroy();
			this.quantityText = null;
		}
		super.destroy(fromScene);
	}
}
