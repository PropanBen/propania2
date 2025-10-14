// === Resource.js ===
import Phaser from "phaser";

export default class Resource extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, resource) {
		// Nutzt jetzt das richtige property: resource.key
		super(scene, resource.x, resource.y, resource.key);

		this.scene = scene;
		this.world_resource_id = resource.id;
		this.resource_id = resource.resource_id;
		this.key = resource.key;
		this.name = resource.name;
		this.setOrigin(0.5, 0.5);
		scene.add.existing(this);
		scene.physics.add.existing(this, true); // static body
		this.setDepth(11);
		this.body.setSize(40, 40);
		this.body.setOffset(this.width - this.width / 2 - 20, 235);

		// Label
		this.nameText = scene.add
			.text(this.x, this.y - 18, this.name, {
				fontSize: "12px",
				color: "#fff",
			})
			.setOrigin(0.5);
		this.nameText.setDepth(1000);
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
