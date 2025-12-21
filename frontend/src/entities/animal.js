// client/entities/animal.js

import Phaser from "phaser";
import { socket } from "../socket.js";

export default class Animal extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, data) {
		super(scene, data.x, data.y, data.spritekey);

		this.scene = scene;

		// ---- Server-Daten ----
		this.id = data.id;
		this.type = data.type;
		this.spritekey = data.spritekey;

		this.state = data.state || "idle";
		this.lastDirection = data.last_direction || "down";
		this.currentHealth = data.currenthealth ?? 100;
		this.followTarget = data.followTarget || null;
		this.target = null;

		// ---- Phaser Setup ----
		scene.add.existing(this);
		scene.physics.add.existing(this);
		scene.animalGroup.add(this);

		this.body.setSize(25, 25);
		this.body.setOffset(3.5, 3.5);
		this.body.allowGravity = false;

		// ---- Animation Controller ----
		this.animation = new AnimalAnimationController(scene, this);

		// ---- Socket Events ----
		socket.on("animal:update", (data) => {
			if (this.id !== data.id) return;
			this.syncFromServer(data);
		});

		socket.on("animal:hitted", (animalId) => {
			if (this.id !== animalId) return;
			this.onHit();
		});

		socket.on("animal:dead", (data) => {
			if (data.id !== this.id) return;
			this.setState("dead");
		});
	}

	update() {
		// Lerp Position
		if (this.targetX !== undefined && this.targetY !== undefined) {
			const lerpFactor = 0.2; // je kleiner, desto langsamer
			this.x += (this.targetX - this.x) * lerpFactor;
			this.y += (this.targetY - this.y) * lerpFactor;
		}

		if (this.animation) this.animation.update();
	}

	// ---- State Management ----
	setState(newState) {
		if (this.state === newState) return;
		this.state = newState;

		if (newState === "dead") {
			this.body.enable = false;
			this.body.setVelocity(0, 0);
			const deadAnimKey = `${this.spritekey}_dead`;
			if (this.scene.anims.exists(deadAnimKey)) {
				this.play(deadAnimKey, true);
				this.animation.currentAnim = deadAnimKey;
				this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
					socket.emit("world:item:spawn:request", {
						resourceType: this.spritekey,
						x: this.x,
						y: this.y,
					});
					this.destroy();
				});
			} else {
				this.destroy();
			}
		}
	}

	// ---- Damage Handling ----
	takeDamage(damage) {
		socket.emit("animal:hit", this.id, damage);
	}

	onHit() {
		this.setTint(0xff0000);
		this.scene.sound.play("sheepbleat");
		setTimeout(() => this.clearTint(), 100);
	}

	// ---- Server Synchronisation ----
	syncFromServer(data) {
		if (typeof data.x === "number") this.targetX = data.x;
		if (typeof data.y === "number") this.targetY = data.y;
		if (data.state) this.state = data.state;
		if (data.last_direction) this.lastDirection = data.last_direction;
		if (typeof data.currenthealth === "number") this.currentHealth = data.currenthealth;
		if (data.followTarget !== undefined) this.followTarget = data.followTarget;

		if (this.animation) this.animation.update();
	}

	// ---- Toggle Follow Funktion ----
	toggleFollow(playerId) {
		socket.emit("animal:state:change", this.id, playerId);
	}
}

// ------------------------------
// Animation Controller
// ------------------------------
class AnimalAnimationController {
	constructor(scene, animal) {
		this.scene = scene;
		this.animal = animal;
		this.currentAnim = null;
	}

	update() {
		if (!this.animal.active || this.animal.state === "dead") return;

		let animKey = `${this.animal.spritekey}_${this.animal.state}_${this.animal.lastDirection}`;
		if (!this.scene.anims.exists(animKey)) {
			animKey = `${this.animal.spritekey}_idle_${this.animal.lastDirection}`;
		}

		if (animKey !== this.currentAnim) {
			this.animal.play(animKey, true);
			this.currentAnim = animKey;
		}
	}
}
