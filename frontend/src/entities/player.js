// src/entities/player.js
import { socket } from "../socket";

import PlayerMovementController from "./playerMovementController";
import PlayerAnimationController from "./playerAnimationController";
import PlayerInteractionController from "./playerInteractionController";
import PlayerCameraController from "./playerCameraController";
import PlayerNetworking from "./playerNetworking";
import Inventory from "./inventory";

export default class Player extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, playerInfo) {
		super(scene, playerInfo.positionX, playerInfo.positionY, "player");

		this.scene = scene;

		// ------------------------------
		// Basis-Player-Daten
		// ------------------------------
		this.id = playerInfo.id;
		this.socket_id = playerInfo.socket_id;
		this.name = playerInfo.name;
		this.inventory_id = playerInfo.inventory_id;

		// ------------------------------
		// Player Stats
		// ------------------------------
		this.stats = {
			money: playerInfo.money,
			exp: playerInfo.exp,
			level: playerInfo.level,
			health: playerInfo.currenthealth,
		};

		this.state = "idle";
		this.lastDirection = "down";
		this.isInAction = false;

		// ------------------------------
		// Phaser Sprite Setup
		// ------------------------------
		scene.add.existing(this);
		scene.physics.add.existing(this);

		this.body.setSize(16, 16);
		this.body.setOffset(24, 48);
		this.setDepth(1000);
		this.setScale(2);

		// ------------------------------
		// NameTag
		// ------------------------------
		this.nameText = scene.add
			.text(this.x, this.y - 40, this.name, {
				fontSize: "14px",
				color: "#fff",
			})
			.setOrigin(0.5)
			.setDepth(1000);

		// ------------------------------
		// Module-Initialisierung
		// ------------------------------
		this.movement = new PlayerMovementController(scene, this);
		this.animation = new PlayerAnimationController(scene, this);
		//	this.interaction = new PlayerInteractionController(scene, this);
		this.network = new PlayerNetworking(this);
		this.inventory = new Inventory(this.inventory_id, "player");
		if (this.inventory) {
			this.scene.events.emit("inventory:ready");
		}

		if (this.isLocal()) {
			this.camera = new PlayerCameraController(scene, this);
			this.interaction = new PlayerInteractionController(scene, this);
		}

		this.createDialogBox();
	}

	// -------------------------------------------------------------
	// Update – wird von GameScene aufgerufen
	// -------------------------------------------------------------
	update() {
		if (!this.scene || !this.scene.sys.isActive()) return;

		if (this.movement) this.movement.update();
		if (this.animation) this.animation.update();
		if (this.interaction) this.interaction.update();
		if (this.camera) this.camera.update();
		if (this.network) this.network.update();

		// NameTag immer mitziehen
		if (this.nameText) this.nameText.setPosition(this.x, this.y - 40);

		if (this.dialogContainer) {
			this.dialogContainer.setPosition(this.x, this.y - 60);
		}
	}

	// -------------------------------------------------------------
	// Prüft, ob dies der lokale Spieler ist
	// -------------------------------------------------------------
	isLocal() {
		return this.socket_id === socket.id;
	}

	// -------------------------------------------------------------
	// Player Stat Setter/Getters
	// -------------------------------------------------------------
	get money() {
		return this.stats.money;
	}
	set money(v) {
		this.stats.money = v;
		this.scene.events.emit("playerMoneyChanged", v);
		this.network.sendPlayerUpdate();
	}

	get exp() {
		return this.stats.exp;
	}
	set exp(v) {
		this.stats.exp = v;
		this.scene.events.emit("playerExpChanged", v);
		this.network.sendPlayerUpdate();
	}

	get level() {
		return this.stats.level;
	}
	set level(v) {
		this.stats.level = v;
		this.scene.events.emit("playerLevelChanged", v);
		this.network.sendPlayerUpdate();
	}

	get health() {
		return this.stats.health;
	}
	set health(v) {
		this.stats.health = v;
		this.scene.events.emit("playerHealthChanged", v);
		this.network.sendPlayerUpdate();
	}

	// -------------------------------------------------------------
	// Cleanup
	// -------------------------------------------------------------
	destroy(fromScene) {
		if (this.nameText) {
			this.nameText.destroy();
			this.nameText = null;
		}

		if (this.movement) this.movement = null;
		if (this.animation) this.animation = null;
		if (this.interaction) {
			this.interaction.destroy();
			this.interaction = null;
		}
		if (this.camera) {
			this.camera.destroy();
			this.camera = null;
		}
		if (this.network) {
			this.network.destroy();
			this.network = null;
		}

		super.destroy(fromScene);
	}

	createDialogBox() {
		const spriteKey = "playerspeakbox"; // dein 32x32 Sprite

		// Hintergrund-Sprite einmalig erstellen, bleibt unverändert
		this.dialogBG = this.scene.add.sprite(0, -60, spriteKey).setOrigin(0.5).setDepth(1000);

		// Text
		this.dialogText = this.scene.add
			.text(0, -60, "", {
				fontSize: "20px",
				color: "#000000",
				align: "center",
				wordWrap: { width: 200 }, // max. Textbreite
			})
			.setOrigin(0.5)
			.setDepth(1001);

		// Container
		this.dialogContainer = this.scene.add.container(this.x, this.y, [this.dialogBG, this.dialogText]).setDepth(1000).setVisible(false);
	}

	showDialog(text, duration = 5000) {
		if (!this.dialogContainer) return;

		this.dialogText.setText(text);

		// Passe Hintergrund-Sprite an Textgröße an
		const padding = 10; // Abstand um den Text
		const bgWidth = Math.max(this.dialogText.width + padding * 2, 32); // min 32px
		const bgHeight = Math.max(this.dialogText.height + padding * 2, 32);

		// Sprite skalieren, um den Text zu umschließen
		this.dialogBG.setDisplaySize(bgWidth, bgHeight);

		this.dialogContainer.setVisible(true);

		// Auto-close
		this.scene.time.delayedCall(duration, () => {
			if (this.dialogContainer) this.dialogContainer.setVisible(false);
		});
	}
}
