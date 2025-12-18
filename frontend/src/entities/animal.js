// src/entities/animal.js
import { socket } from "../socket.js";

export default class Animal extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, animalInfo) {
		super(scene, animalInfo.x, animalInfo.y, animalInfo.type);

		this.scene = scene;
		this.type = animalInfo.type;

		this.id = animalInfo.id;
		this.name = animalInfo.name || animalInfo.type;
		this.health = animalInfo.health || 100;
		this.maxHealth = animalInfo.maxHealth || 100;

		this.state = "idle";
		this.lastDirection = "down";

		scene.add.existing(this);
		scene.physics.add.existing(this);
		scene.animalGroup.add(this);

		this.body.setSize(25, 25);
		this.body.setOffset(3.5, 3.5);
		this.body.allowGravity = false;

		this.setScale(1);
		this.setDepth(1000);

		this.animation = new AnimalAnimationController(scene, this);

		this.speed = 30;
		this.runSpeed = 100;
		this.targetPos = null;

		this.network = new AnimalNetworking(this);

		this.moveEvent = this.scene.time.addEvent({
			delay: 2000,
			callback: this.chooseRandomTarget,
			callbackScope: this,
			loop: true,
		});
	}

	update() {
		if (!this.scene || !this.scene.sys.isActive()) return;
		if (this.state === "dead") return;

		this.handleState();
		this.animation.update();
		this.network.update();
	}

	handleState() {
		if (this.state === "dead") return;

		if (this.health / this.maxHealth < 0.2) {
			this.state = "run";
			this.moveAwayFromPlayer();
			return;
		}

		if (this.targetPos) {
			const dx = this.targetPos.x - this.x;
			const dy = this.targetPos.y - this.y;

			if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
				this.setVelocity(0, 0);
				this.state = "idle";
				this.targetPos = null;
				return;
			}

			this.state = "walk";
			const angle = Math.atan2(dy, dx);
			this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);

			if (Math.abs(dx) > Math.abs(dy)) {
				this.lastDirection = dx > 0 ? "right" : "left";
			} else {
				this.lastDirection = dy > 0 ? "down" : "up";
			}
		} else {
			this.state = "idle";
			this.setVelocity(0, 0);
		}
	}

	moveAwayFromPlayer() {
		if (!this.scene.localPlayer) return;

		const player = this.scene.localPlayer;
		const dx = this.x - player.x;
		const dy = this.y - player.y;

		if (dx === 0 && dy === 0) return;

		const angle = Math.atan2(dy, dx);
		this.setVelocity(Math.cos(angle) * this.runSpeed, Math.sin(angle) * this.runSpeed);

		if (Math.abs(dx) > Math.abs(dy)) {
			this.lastDirection = dx > 0 ? "right" : "left";
		} else {
			this.lastDirection = dy > 0 ? "down" : "up";
		}
	}

	chooseRandomTarget() {
		this.targetPos = {
			x: Phaser.Math.Between(100, 800),
			y: Phaser.Math.Between(100, 600),
		};
	}

	takeDamage(amount) {
		if (this.state === "dead") return;

		this.health -= amount;
		this.scene.sound.play("sheepbleat");

		// Bewegung stoppen
		if (this.body) {
			this.setVelocity(0, 0);
			this.targetPos = null;
		}

		// ---------- HIT BOUNCE ----------
		// leichter Rückstoß nach oben
		this.scene.tweens.add({
			targets: this,
			y: this.y - 6,
			duration: 80,
			yoyo: true,
			//	ease: "Quad.out",
			ease: "Sine.out",
		});

		// ---------- HIT FLASH ----------
		this.setTint(0xff0000);

		// --------- LEBEND ---------
		if (this.health > 0) {
			this.scene.time.delayedCall(300, () => {
				if (!this.scene || !this.body || this.state === "dead") return;
				this.clearTint();
			});
			return;
		}

		// --------- TOD ---------
		this.state = "dead";
		this.clearTint();

		if (this.moveEvent) this.moveEvent.remove(false);
		if (this.body) {
			this.body.enable = false;
			this.setVelocity(0, 0);
		}

		const deathAnimKey = `${this.type}_death`;

		if (this.anims && this.scene.anims.exists(deathAnimKey)) {
			this.anims.stop();
			this.play(deathAnimKey, true);

			this.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + deathAnimKey, () => {
				socket.emit("world:item:spawn:request", {
					resourceType: "sheep",
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
		if (this.animal.state === "dead") return;

		const animKey = this.getAnimationKey();
		if (animKey && animKey !== this.currentAnim) {
			this.animal.play(animKey, true);
			this.currentAnim = animKey;
		}
	}

	getAnimationKey() {
		const { state, lastDirection, type } = this.animal;

		switch (state) {
			case "idle":
				return `${type}_idle_${lastDirection}`;
			case "walk":
				return `${type}_walk_${lastDirection}`;
			case "run":
				return `${type}_run_${lastDirection}`;
			case "attack":
				return `${type}_attack_${lastDirection}`;
			default:
				return null;
		}
	}
}

// ------------------------------
// Networking
// ------------------------------
class AnimalNetworking {
	constructor(animal) {
		this.animal = animal;
	}

	update() {
		if (this.animal.state === "dead") return;

		socket.emit("animal:update", {
			id: this.animal.id,
			x: this.animal.x,
			y: this.animal.y,
			anim: this.animal.animation.currentAnim,
			health: this.animal.health,
		});
	}
}
