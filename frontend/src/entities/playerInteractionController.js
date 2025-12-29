import Item from "./items.js";
import Resource from "./resources.js";
import Animal from "./animal.js";
import NPC from "./npc.js";
import Building from "./buildings.js";
import { socket } from "../socket.js";

export default class PlayerInteractionController {
	constructor(scene, player) {
		this.scene = scene;
		this.player = player;
		this._actionTarget = null;

		this.offsets = {
			up: { x: 0, y: 0 },
			down: { x: 0, y: 48 },
			left: { x: -32, y: 16 },
			right: { x: 32, y: 16 },
		};

		this.actionzoneOffset = { ...this.offsets[player.lastDirection] };

		// Actionzone erstellen
		if (this.player.isLocal()) {
			this.actionzone = this.scene.add.rectangle(
				this.player.x + this.actionzoneOffset.x,
				this.player.y + this.actionzoneOffset.y,
				32,
				32,
				0xffffff,
				0
			);
			this.scene.physics.add.existing(this.actionzone, false);
			this.actionzone.body.setAllowGravity(false);
			this.actionzone.body.setImmovable(true);
			this.actionzone.setDepth(11);
		}

		// Interactables existieren evtl. noch nicht
		this.interactables = this.scene.interactablesGroup || this.scene.physics.add.group();
		this.animals = this.scene.animalGroup;
		this.npcs = this.scene.npcGroup;
		this.walls = this.scene.wallsGroup;
		this.insideTriggers = this.scene.insideTriggerGroup;
		// Collision detection via physics
		if (this.actionzone && this.interactables) {
			this.scene.physics.add.overlap(this.actionzone, this.interactables, (zone, object) => {
				this.actionTarget = object;
			});
		}

		if (this.actionzone && this.animals) {
			this.scene.physics.add.overlap(this.actionzone, this.animals, (zone, object) => {
				this.actionTarget = object;
			});
		}

		if (this.actionzone && this.npcs) {
			this.scene.physics.add.overlap(this.actionzone, this.npcs, (zone, object) => {
				this.actionTarget = object;
			});
		}

		if (this.actionzone && this.scene.triggerGroup) {
			this.scene.physics.add.overlap(this.actionzone, this.scene.triggerGroup, (zone, object) => {
				this.actionTarget = object;
			});
		}
	}

	get actionTarget() {
		return this._actionTarget;
	}

	set actionTarget(value) {
		if (value) {
			if (value instanceof Item && this.scene.interactText) {
				this.scene.interactText.setText("[E] Pick up");
				this.scene.interactText.setPosition(value.x, value.y - 30);
				this.scene.interactText.setVisible(true);
			}
		} else {
			if (this.scene.interactText) this.scene.interactText.setVisible(false);
		}
		this._actionTarget = value;
	}

	update() {
		if (!this.player.scene.sys.isActive()) return;

		// Richtung aktualisieren
		this.updateDirectionOffset();

		// Actionzone bewegen
		if (this.actionzone) {
			this.actionzone.setPosition(this.player.x + this.actionzoneOffset.x, this.player.y + this.actionzoneOffset.y);
			this.actionzone.setDepth(this.player.lastDirection === "up" ? 8 : 11);
		}

		// Überprüfe ob actionTarget noch innerhalb der Zone ist
		if (this.actionTarget && this.actionzone && this.actionTarget.body) {
			const padding = 8;

			const zoneBounds = this.actionzone.getBounds();
			Phaser.Geom.Rectangle.Inflate(zoneBounds, padding, padding);

			// Body-Bounds vom Physics-Body holen
			const targetBody = this.actionTarget.body;
			const targetBounds = new Phaser.Geom.Rectangle(targetBody.x, targetBody.y, targetBody.width, targetBody.height);

			if (!Phaser.Geom.Intersects.RectangleToRectangle(zoneBounds, targetBounds)) {
				this.actionTarget = null;
			}
		}
	}

	updateDirectionOffset() {
		const dir = this.player.lastDirection;
		if (this.offsets[dir]) this.actionzoneOffset = this.offsets[dir];
	}

	/**
	 * Hilfsfunktion: berechne eine sinnvolle Animationsdauer (ms)
	 * Versuch: wenn die Animation existiert, nutze Anzahl Frames / frameRate * 1000
	 * Fallback: 800 ms
	 */
	_getAnimationDurationMs(animKey, fallback = 800) {
		if (!this.scene.anims.exists(animKey)) return fallback;
		const anim = this.scene.anims.get(animKey);
		if (!anim || !anim.frames || anim.frames.length === 0) return fallback;
		const frameCount = anim.frames.length;
		const frameRate = anim.frameRate || 5;
		return Math.ceil((frameCount / frameRate) * 1000);
	}

	performAction(type) {
		// wenn bereits in Aktion, nichts tun
		if (this.player.state === "action") return;

		if (type === "interact" && this.actionTarget && this.actionTarget.building) {
			this.actionTarget.building.openDoor();
		}

		if (
			type === "interact" &&
			this.actionTarget instanceof NPC &&
			this.actionTarget.type === "trader" &&
			this.actionTarget.id !== "start_merchant"
		) {
			socket.emit("inventory:open:request", this.actionTarget.id);
		}

		if (type === "interact" && this.actionTarget instanceof NPC && this.actionTarget.id === "start_merchant") {
			this.actionTarget.NPCMenu.toggle();
			//socket.emit("professions:open:request", this.actionTarget.id);
		}

		if (type === "interact" && this.actionTarget instanceof Animal && this.actionTarget.type === "peaceful") {
			this.actionTarget.toggleFollow(this.player.id);
		}

		if (type === "attack") {
			const direction = this.player.lastDirection;
			const animKey = `attack_${direction}`;
			const duration = this._getAnimationDurationMs(animKey, 2050);
			this.player.animation.playActionAnimation("attack", duration);
			this.scene.sound.play("swordswing");
			if (this.actionTarget instanceof Animal) this.actionTarget.takeDamage(10);
		}

		// --- Interact (Pickup) ---
		if (type === "interact" && this.actionTarget instanceof Item) {
			// Spiel Aktion-Animation (falls vorhanden)
			if (this.player.animation && typeof this.player.animation.playActionAnimation === "function") {
				const direction = this.player.lastDirection;
				const animKey = `pickup_${direction}`;
				const duration = this._getAnimationDurationMs(animKey, 2050);
				this.player.animation.playActionAnimation("pickup", duration);
			}

			// Item aufnehmen (sofort) — passt meist besser für pickup
			this.player.inventory.pickupItem(this.player.inventory.inventory_id, this.actionTarget, this.actionTarget.quantity);
			this.scene.sound.play("pop");
			this.actionTarget = null;
			return;
		}

		// --- Drop ---
		if (type === "drop") {
			const dropItem = this.player.inventory.items[0];
			if (!dropItem) return;

			// Spiel zuerst die Drop-Animation, führe dann das Drop aus (so sieht man die Animation)
			const direction = this.player.lastDirection;
			const animKey = `drop_${direction}`;
			const duration = this._getAnimationDurationMs(animKey, 800);

			if (this.player.animation && typeof this.player.animation.playActionAnimation === "function") {
				// setze state und spiele Animation
				this.player.animation.playActionAnimation("drop", duration);
			} else {
				// Falls kein AnimationController vorhanden, setze state kurz
				this.player.state = "action";
				this.player.setVelocity(0, 0);
			}

			// tatsächliches Drop nach Ende der Animation
			this.scene.time.delayedCall(duration, () => {
				// Sicherheitscheck: falls Player noch in action ist, zurücksetzen (AnimationController macht das normalerweise)
				if (this.player.state === "action") {
					this.player.state = "idle";
				}

				// Jetzt das Item droppen
				this.player.inventory.dropItem(this.player.inventory.inventory_id, dropItem, 1);
			});

			return;
		}

		// Resources Interactions

		if (
			type === "interact" &&
			this.actionTarget instanceof Resource &&
			this.actionTarget.resourceType === "tree" &&
			this.actionTarget.hitcounter > 0
		) {
			if (this.player.animation && typeof this.player.animation.playActionAnimation === "function") {
				const direction = this.player.lastDirection;
				const animKey = `tree_${direction}`;
				const duration = this._getAnimationDurationMs(animKey, 2050);
				this.player.animation.playActionAnimation("tree", duration);
			}
			this.actionTarget.gathering_tree(this.player);
			return;
		}

		if (
			type === "interact" &&
			this.actionTarget instanceof Resource &&
			this.actionTarget.resourceType === "rock" &&
			this.actionTarget.hitcounter > 0
		) {
			if (this.player.animation && typeof this.player.animation.playActionAnimation === "function") {
				const direction = this.player.lastDirection;
				const animKey = `rock_${direction}`;
				const duration = this._getAnimationDurationMs(animKey, 2050);
				this.player.animation.playActionAnimation("rock", duration);
			}
			this.actionTarget.gathering_rock(this.player);
			return;
		}
	}

	destroy() {
		if (this.actionzone) {
			this.actionzone.destroy();
			this.actionzone = null;
		}
	}
}
