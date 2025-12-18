// === Resource.js ===
import Phaser from "phaser";
import { socket } from "../socket";
import itemsList from "./itemslist";

export default class Resource extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, resource) {
		// Nutzt jetzt das richtige property: resource.key
		super(scene, resource.x, resource.y, resource.key);

		this.scene = scene;
		this.world_resource_id = resource.id;
		this.resource_id = resource.resource_id;
		this.resourceType = resource.key;
		this.name = resource.name;
		this.setOrigin(0.5, 1);
		scene.add.existing(this);
		scene.physics.add.existing(this, true); // static body
		this.setDepth(11);
		this.setScale(0.5);
		this.hitcounter = 3;

		if (resource.key === "tree") {
			this.body.setSize(20, 20);
			this.body.setOffset((this.width - 20) / 2, this.height - 20);
		} else if (resource.key === "rock") {
			this.setScale(1, 1);
			this.body.setSize(32, 20);
			this.body.setOffset(0, 5);
		}
	}

	setPosition(x, y) {
		super.setPosition(x, y);
		if (this.nameText) this.nameText.setPosition(x, y - 18);
		return this;
	}

	gathering_tree() {
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
					this.remove_tree();
				}
			},
		});
	}

	gathering_rock() {
		const config = { delay: 0.4 };
		this.scene.sound.play("pickaxe", config);
		this.scene.tweens.add({
			targets: this,
			y: this.y + 1,
			duration: 100,
			yoyo: true,
			repeat: 0,
			onComplete: () => {
				this.hitcounter -= 1;
				if (this.hitcounter <= 0) {
					this.remove_rock();
				}
			},
		});
	}

	spawnItems(quantity) {
		let item_id = null;

		socket.emit("world:item:spawn:request", {
			resourceType: this.resourceType,
			x: this.x,
			y: this.y,
		});
	}

	remove_tree() {
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
					socket.emit("world:resources:remove", this.world_resource_id);
					this.spawnItems();
					const config = { delay: 0.4 };
					this.scene.sound.play("pop", config);
				});
			},
		});
	}

	remove_rock() {
		this.body.enable = false;

		this.scene.tweens.add({
			targets: this,
			duration: 100,
			repeat: 4,
			yoyo: true,
			angle: { from: -5, to: 5 },
			ease: "Sine.inOut",
			onComplete: () => {
				this.breakRock();
			},
		});
	}

	breakRock() {
		this.scene.sound.play("rockbreaks");

		this.scene.time.delayedCall(0, () => {
			socket.emit("world:resources:remove", this.world_resource_id);
			this.spawnItems();
			this.scene.sound.play("pop", { delay: 0.2 });
		});
	}

	destroy(fromScene) {
		if (this.nameText) {
			this.nameText.destroy();
			this.nameText = null;
		}
		super.destroy(fromScene);
	}
}
