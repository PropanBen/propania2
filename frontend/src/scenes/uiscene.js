import { socket } from "../socket.js";
import Functions from "../assets/utils/functions.js";
import InventoryUI from "../entities/inventoryUI.js";

export default class UIScene extends Phaser.Scene {
	constructor() {
		super("UIScene");
		this.joystickActive = false;
		this.joystickVector = { x: 0, y: 0 };
		this.inventoryUI = null;
		this.player = null;
	}

	create() {
		this.socket = socket;
		this.gameScene = this.scene.get("GameScene");

		// ------------------------------
		// UI Elemente
		// ------------------------------
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

		[ebtn, qbtn, plusbtn, minusbtn, cambtn, inventorybtn].forEach((btn) => btn.setInteractive({ useHandCursor: true }));

		// ------------------------------
		// InventoryUI erstellen (leer)
		// ------------------------------
		this.inventoryUI = new InventoryUI(this, { items: [] });

		// Inventory Button klick
		inventorybtn.on("pointerdown", () => this.toggleInventoryUI());

		// Tastatur I
		this.input.keyboard.on("keydown-I", () => this.toggleInventoryUI());

		// ------------------------------
		// Player ready
		// ------------------------------
		this.gameScene.events.on("localPlayerReady", (player) => {
			this.player = player;

			plusbtn.on("pointerdown", () => player.camera?.zoomIn());
			minusbtn.on("pointerdown", () => player.camera?.zoomOut());
			cambtn.on("pointerdown", () => player.camera?.toggleFreeMode());
			ebtn.on("pointerdown", () => player.interaction?.performAction("interact"));
			qbtn.on("pointerdown", () => player.interaction?.performAction("drop"));

			// Items setzen, falls Player Inventory hat
			if (player.inventory) {
				this.inventoryUI.inventory = player.inventory;
			}
		});

		// ------------------------------
		// Stats Events
		// ------------------------------
		this.game.events.on("playerHealthChanged", (h) => this.healthText.setText(`${h}/100`));
		this.game.events.on("playerMoneyChanged", (m) => this.moneyText.setText(`${m}`));
		this.game.events.on("playerExpChanged", (xp) => this.xpText.setText(`${xp}`));
		this.game.events.on("playerLevelChanged", (lvl) => this.lvlText.setText(`${lvl}`));

		// ------------------------------
		// Joystick
		// ------------------------------
		this.createJoystick();
	}

	toggleInventoryUI() {
		if (!this.inventoryUI) return;
		this.inventoryUI.toggle();
	}

	// -------------------------------------------------
	// JOYSTICK
	// -------------------------------------------------
	createJoystick() {
		const radius = 80;
		const innerRadius = 40;
		const cx = 100;
		const cy = this.cameras.main.height - 150;

		this.joyBG = this.add.graphics();
		this.joyBG.fillStyle(0x000000, 0.5);
		this.joyBG.fillCircle(cx, cy, radius);
		this.joyBG.setScrollFactor(0);

		this.joyStick = this.add.graphics();
		this.joyStick.fillStyle(0xffffff, 0.6);
		this.joyStick.fillCircle(cx, cy, innerRadius);
		this.joyStick.setScrollFactor(0);

		this.joyCenter = { x: cx, y: cy };

		this.input.on("pointerdown", (p) => {
			const dist = Phaser.Math.Distance.Between(p.x, p.y, cx, cy);
			if (dist < radius + 40) this.joystickActive = true;
		});

		this.input.on("pointerup", () => {
			this.joystickActive = false;
			this.updateStickGraphics(cx, cy);
			this.joystickVector = { x: 0, y: 0 };
		});

		this.input.on("pointermove", (p) => {
			if (!this.joystickActive) return;

			const dx = p.x - cx;
			const dy = p.y - cy;
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
}
