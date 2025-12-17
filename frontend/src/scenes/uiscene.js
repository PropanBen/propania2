import { socket } from "../socket.js";
import Functions from "../assets/utils/functions.js";
import InventoryUI from "../entities/inventoryUI.js";
import Inventory from "../entities/inventory.js";

export default class UIScene extends Phaser.Scene {
	constructor() {
		super("UIScene");
		this.joystickActive = false;
		this.joystickVector = { x: 0, y: 0 };
		this.player = null;

		//Chat
		this.chatContainer = null;
	}

	create() {
		this.inventoryUI = null;
		this.otherinventoryUI = null;
		this.socket = socket;
		this.gameScene = this.scene.get("GameScene");
		this.chatMessages = [];
		this.createChatUI();

		// ------------------------------
		// UI Elemente
		// ------------------------------
		const healthbtn = this.add.sprite(30, 50, "hp").setScale(4);
		const xpbtn = this.add.sprite(30, 120, "xp").setScale(4);
		const moneybtn = this.add.sprite(30, 190, "money").setScale(4);
		const lvlbtn = this.add.sprite(30, 260, "lvl").setScale(4);

		const ebtn = this.add.sprite(window.innerWidth - 150, window.innerHeight - 100, "e").setScale(4);
		const fbtn = this.add.sprite(window.innerWidth - 150, window.innerHeight - 200, "f").setScale(4);
		const qbtn = this.add.sprite(window.innerWidth - 50, window.innerHeight - 200, "q").setScale(4);
		const plusbtn = this.add.sprite(220, window.innerHeight - 230, "plus").setScale(4);
		const minusbtn = this.add.sprite(220, window.innerHeight - 80, "minus").setScale(4);
		const cambtn = this.add.sprite(100, window.innerHeight - 290, "cam").setScale(4);
		const inventorybtn = this.add.sprite(window.innerWidth - 50, window.innerHeight - 100, "inventory").setScale(4);

		this.healthText = this.add.text(60, 20, "", Functions.defaultTextStyle);
		this.xpText = this.add.text(60, 70, "0", Functions.defaultTextStyle);
		this.moneyText = this.add.text(60, 120, "0", Functions.defaultTextStyle);
		this.lvlText = this.add.text(60, 170, "1", Functions.defaultTextStyle);

		[ebtn, fbtn, qbtn, plusbtn, minusbtn, cambtn, inventorybtn].forEach((btn) => btn.setInteractive({ useHandCursor: true }));

		// ------------------------------
		// InventoryUI
		// ------------------------------
		this.inventoryUI = new InventoryUI(this, null);
		inventorybtn.on("pointerdown", () => this.toggleInventoryUI());
		//this.input.keyboard.on("keydown-I", () => this.toggleInventoryUI());
		//this.input.keyboard.on("keydown-T", () => this.toggleChat());

		// ------------------------------
		// Player ready
		// ------------------------------
		this.gameScene.events.on("localPlayerReady", (player) => {
			this.player = player;
			this.inventoryUI.inventory = player.inventory;

			plusbtn.on("pointerdown", () => player.camera?.zoomIn());
			minusbtn.on("pointerdown", () => player.camera?.zoomOut());
			cambtn.on("pointerdown", () => player.camera?.toggleFreeMode());
			ebtn.on("pointerdown", () => player.interaction?.performAction("interact"));
			fbtn.on("pointerdown", () => player.interaction?.performAction("attack"));
			qbtn.on("pointerdown", () => player.interaction?.performAction("drop"));
		});

		// ------------------------------
		// Stats Events
		// ------------------------------
		this.game.events.on("playerHealthChanged", (h) => this.healthText.setText(`${h}/100`));
		this.game.events.on("playerMoneyChanged", (m) => this.moneyText.setText(`${m}`));
		this.game.events.on("playerExpChanged", (xp) => this.xpText.setText(`${xp}`));
		this.game.events.on("playerLevelChanged", (lvl) => this.lvlText.setText(`${lvl}`));
		this.game.events.on("toggleInventory", () => this.toggleInventoryUI());
		this.game.events.on("toggleChat", () => this.toggleChat());

		// ------------------------------
		// Joystick
		// ------------------------------
		this.createJoystick();

		// Socket Event
		socket.on("chat:message", ({ playerName, message }) => {
			this.chatMessages.push(`${playerName}: ${message}`);
			if (this.chatMessages.length > 10) this.chatMessages.shift();
			this.chatText.setText(this.chatMessages.join("\n"));

			// Optional: Zeige die Nachricht auch über Spieler Dialogbox
			const player = this.gameScene.players[socket.id];
			if (player) player.showDialog(`${playerName}: ${message}`, 4000);
		});

		socket.on("inventory:open:true", (npcInventory) => {
			this.otherinventoryUI = null;
			const npcinventory = new Inventory(npcInventory.id, "buy");
			npcinventory.items = npcInventory.items;
			this.otherinventoryUI = new InventoryUI(this, npcinventory);

			this.inventoryUI.setPosition(100, 200);
			this.otherinventoryUI.setPosition(+500, 200);
			this.inventoryUI.inventory.type = "sell";
			this.toggleInventoryUI();
			this.otherinventoryUI.refresh();
			this.otherinventoryUI.container.setVisible(true);
		});

		socket.on("inventory:other:refresh", (npcInventory) => {
			if (this.otherinventoryUI) {
				this.otherinventoryUI.inventory.items = npcInventory.items;
				this.otherinventoryUI.refresh();
			}
		});
	}

	// =================================================
	// INVENTORY
	// =================================================
	toggleInventoryUI() {
		if (!this.inventoryUI) return;

		if (!this.otherinventoryUI) {
			this.inventoryUI.inventory.type = "drop";
		}

		this.inventoryUI.toggle();
	}

	// =================================================
	// JOYSTICK
	// =================================================
	createJoystick() {
		const radius = 80;
		const innerRadius = 40;
		const cx = 100;
		const cy = window.innerHeight - 150;

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

	createChatUI() {
		const width = 300;
		const height = 200;

		this.chatContainer = this.add.container(10, window.innerHeight - 600).setDepth(1200);
		this.chatContainer.setVisible(false);

		// Hintergrund
		const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0, 0);
		this.chatContainer.add(bg);

		// Chat Text
		this.chatText = this.add.text(5, 5, "", { fontSize: "14px", color: "#fff", wordWrap: { width: width - 10 } });
		this.chatContainer.add(this.chatText);

		// Eingabefeld (HTML Input Overlay)
		this.chatInput = document.createElement("input");
		this.chatInput.type = "text";
		this.chatInput.style.position = "absolute";
		this.chatInput.style.left = "10px";
		this.chatInput.style.top = `${window.innerHeight - 370}px`;
		this.chatInput.style.width = `${width}px`;
		this.chatInput.style.zIndex = 1000;
		document.body.appendChild(this.chatInput);
		this.chatInput.style.display = "none";

		this.chatInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				const msg = this.chatInput.value.trim();
				if (msg) {
					socket.emit("chat:message", msg);
					this.chatInput.value = "";
				}
			}
		});
	}

	toggleChat() {
		if (!this.chatContainer) return;
		this.chatContainer.setVisible(!this.chatContainer.visible);

		// Optional auch das Input-Feld ein-/ausblenden
		if (this.chatInput) this.chatInput.style.display = this.chatContainer.visible ? "block" : "none";
	}
}
