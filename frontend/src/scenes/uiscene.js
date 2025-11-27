import { socket } from "../socket.js";
import Functions from "../assets/utils/functions.js";

export default class UIScene extends Phaser.Scene {
	constructor() {
		super("UIScene");
		this.sceneKey = "UIScene";

		this.joystickActive = false;
		this.joystickVector = { x: 0, y: 0 };
	}

	create() {
		this.socket = socket;

		const gameScene = this.scene.get("GameScene");

		const healthbtn = this.add.sprite(30, 30, "hp").setScale(3);
		const xpbtn = this.add.sprite(30, 80, "xp").setScale(3);
		const moneybtn = this.add.sprite(30, 130, "money").setScale(3);
		const lvlbtn = this.add.sprite(30, 180, "lvl").setScale(3);
		const ebtn = this.add.sprite(270, window.innerHeight - 100, "e").setScale(3);
		const qbtn = this.add.sprite(270, window.innerHeight - 200, "q").setScale(3);
		const plusbtn = this.add.sprite(180, window.innerHeight - 270, "plus").setScale(3);
		const minusbtn = this.add.sprite(120, window.innerHeight - 270, "minus").setScale(3);
		const cambtn = this.add.sprite(60, window.innerHeight - 270, "cam").setScale(3);
		const inventorybtn = this.add.sprite(270, window.innerHeight - 270, "inventory").setScale(3);

		this.healthText = this.add.text(60, 20, "", Functions.defaultTextStyle);
		this.xpText = this.add.text(60, 70, "0", Functions.defaultTextStyle);
		this.moneyText = this.add.text(60, 120, "0", Functions.defaultTextStyle);
		this.lvlText = this.add.text(60, 170, "1", Functions.defaultTextStyle);

		ebtn.setInteractive({ useHandCursor: true });
		qbtn.setInteractive({ useHandCursor: true });
		plusbtn.setInteractive({ useHandCursor: true });
		minusbtn.setInteractive({ useHandCursor: true });
		cambtn.setInteractive({ useHandCursor: true });
		inventorybtn.setInteractive({ useHandCursor: true });

		this.scene.get("GameScene").events.on("inventoryReady", (inventory) => {
			inventorybtn.on("pointerdown", () => inventory.toggleUI());
		});

		plusbtn.on("pointerdown", () => this.zoomCamera(0.1));
		minusbtn.on("pointerdown", () => this.zoomCamera(-0.1));

		cambtn.on("pointerdown", () => {
			this.toggleFreeCamera();
		});

		ebtn.on("pointerdown", () => {
			gameScene.tryPickup();
		});

		qbtn.on("pointerdown", () => {
			gameScene.tryDrop(gameScene.inventory.items[0]);
		});

		gameScene.events.on("playerHealthChanged", (newHealth) => {
			this.healthText.setText(`${newHealth}/100`);
		});

		gameScene.events.on("playerMoneyChanged", (newMoney) => {
			this.moneyText.setText(`${newMoney}`);
		});

		gameScene.events.on("playerExpChanged", (newExp) => {
			this.xpText.setText(`${newExp}`);
		});

		gameScene.events.on("playerLevelChanged", (newLvL) => {
			this.lvlText.setText(`${newLvL}`);
		});

		this.createJoystick();
	}

	createJoystick() {
		const radius = 80;
		const innerRadius = 40;

		// Position relativ zur Canvas-Größe
		const cx = this.cameras.main.width * 0.2 - 50; // 20% von links
		const cy = this.cameras.main.height * 0.8; // 80% von oben

		// --------------------------
		//  GRAPHICS JOYSTICK
		// --------------------------

		// Outer circle (background)
		this.joyBG = this.add.graphics();
		this.joyBG.fillStyle(0x000000, 0.5); // besser sichtbar auf Mobile
		this.joyBG.fillCircle(cx, cy, radius);
		this.joyBG.setScrollFactor(0);

		// Inner circle (stick)
		this.joyStick = this.add.graphics();
		this.joyStick.fillStyle(0xffffff, 0.6);
		this.joyStick.fillCircle(cx, cy, innerRadius);
		this.joyStick.setScrollFactor(0);

		this.joyCenter = { x: cx, y: cy };

		// ----- Pointer Events -----
		this.input.on("pointerdown", (p) => {
			const pX = p.x / this.scale.displayScale.x;
			const pY = p.y / this.scale.displayScale.y;

			const dist = Phaser.Math.Distance.Between(pX, pY, cx, cy);
			if (dist < radius + 40) {
				this.joystickActive = true;
			}
		});

		this.input.on("pointerup", () => {
			this.joystickActive = false;
			this.updateStickGraphics(cx, cy);
			this.joystickVector = { x: 0, y: 0 };
		});

		this.input.on("pointermove", (p) => {
			if (!this.joystickActive) return;

			const pX = p.x / this.scale.displayScale.x;
			const pY = p.y / this.scale.displayScale.y;

			const dx = pX - cx;
			const dy = pY - cy;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const max = 60;

			const clamped = Math.min(max, dist);
			const angle = Math.atan2(dy, dx);

			const stickX = cx + Math.cos(angle) * clamped;
			const stickY = cy + Math.sin(angle) * clamped;

			this.updateStickGraphics(stickX, stickY);

			this.joystickVector = {
				x: Math.cos(angle) * (clamped / max),
				y: Math.sin(angle) * (clamped / max),
			};
		});
	}

	updateStickGraphics(x, y) {
		this.joyStick.clear();
		this.joyStick.fillStyle(0xffffff, 0.6);
		this.joyStick.fillCircle(x, y, 40);
	}

	getJoystickVector() {
		return this.joystickVector;
	}

	zoomCamera(amount) {
		const gameScene = this.scene.get("GameScene");
		if (!gameScene || !gameScene.player) return;

		const camera = gameScene.cameras.main;
		camera.zoom = Phaser.Math.Clamp(camera.zoom + amount, 0.5, 3);
	}

	toggleFreeCamera() {
		const gameScene = this.scene.get("GameScene");
		if (!gameScene || !gameScene.player) return;

		const player = gameScene.player;
		const camera = gameScene.cameras.main;

		player.freeCameraMode = !player.freeCameraMode;
		if (player.freeCameraMode) camera.stopFollow();
		else camera.startFollow(player);
	}
}
