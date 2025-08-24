import Phaser from 'phaser';
import itemsList from '../entities/itemslist.js';

export default class Item extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, info) {
		// Suche Item in der Liste, um den Frame zu erhalten
		const itemData = itemsList.find((item) => item.key === info.key);

		if (!itemData) {
			console.warn(`Item key "${info.key}" nicht in itemslist.js gefunden.`);
		}

		super(scene, info.x, info.y, 'items', itemData?.frame ?? 0);

		this.scene = scene;
		this.world_item_id = info.id;
		this.item_id = info.item_id;
		this.item_key = info.key;
		this.name = info.name ?? itemData?.name ?? 'Unknown';
		this.quantity = info.quantity ?? 1;

		scene.add.existing(this);
		scene.physics.add.existing(this, true); // static body
		this.setDepth(11);
		this.setScale(2);

		this.normalizeSize(32, 32);

		// Optional: kleines Label
		this.nameText = scene.add
			.text(this.x, this.y - 18, this.name, { fontSize: '12px', color: '#fff' })
			.setOrigin(0.5);
		this.nameText.setDepth(1000);
	}

	normalizeSize(targetWidth, targetHeight) {
		const scaleX = targetWidth / this.width;
		const scaleY = targetHeight / this.height;
		const scale = Math.min(scaleX, scaleY);
		this.setScale(scale);
		this.body.setSize(this.width * scale, this.height * scale);
		this.body.setOffset(
			(this.width - this.width * scale) / 2,
			(this.height - this.height * scale) / 2
		);
	}

	setPosition(x, y) {
		super.setPosition(x, y);
		if (this.nameText) this.nameText.setPosition(x, y - 18);
		return this;
	}

	destroy(fromScene) {
		if (this.nameText) {
			this.nameText.destroy();
			this.nameText = null;
		}
		super.destroy(fromScene);
	}
}
