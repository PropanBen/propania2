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
		this.setOrigin(0.5, 1);
		scene.add.existing(this);
		scene.physics.add.existing(this, true); // static body
		this.setDepth(11);
		this.body.setSize(40, 40);
		this.body.setOffset(this.width - this.width / 2 - 20, 235);
		this.hitcounter = 3;

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

	gathering() {
		const config = { delay: 0.4 };
		this.scene.sound.play("chop", config);
		this.scene.tweens.add({
			targets: this,
			y: this.y + 1,
			duration: 100,
			yoyo: true,
			repeat: 0,
			onComplete: () => {
				this.hitcounter -= 1;
				if (this.hitcounter <= 0) {
					this.remove();
				}
			},
		});
	}

	remove() {
		this.body.enable = false;
		this.scene.sound.play("treefall");
		this.scene.tweens.add({
			targets: this,
			angle: 90,
			duration: 3000,
			ease: "Cubic.easeIn",
			onComplete: () => {
				this.scene.sound.play("treefalldown");
				this.body.enable = false;
				this.scene.time.delayedCall(1000, () => {
					this.scene.socket.emit("world:resources:remove", { world_resource_id: this.world_resource_id });
				});
			},
		});
	}

	spanwnItems() {}

	destroy(fromScene) {
		if (this.nameText) {
			this.nameText.destroy();
			this.nameText = null;
		}
		super.destroy(fromScene);
	}
}
