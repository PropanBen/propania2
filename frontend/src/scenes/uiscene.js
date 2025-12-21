import { socket } from "../socket.js";
import Functions from "../assets/utils/functions.js";
import InventoryUI from "../entities/inventoryUI.js";
import Inventory from "../entities/inventory.js";
import API_BASE from "../config/api.js";

export default class UIScene extends Phaser.Scene {
	constructor(data) {
		super("UIScene");
		this.onLogout = data.onLogout;
		this.joystickActive = false;
		this.joystickVector = { x: 0, y: 0 };
		this.player = null;
		this.chatContainer = null;
		this.otherinventoryUI = null;
	}

	create() {
		this.socket = socket;
		this.gameScene = this.scene.get("GameScene");
		this.chatMessages = [];
		this.createChatUI();

		// ------------------------------
		// UI Elemente (Stats & Buttons)
		// ------------------------------
		const healthbtn = this.add.sprite(30, 50, "hp").setScale(4);
		const xpbtn = this.add.sprite(30, 120, "xp").setScale(4);
		const moneybtn = this.add.sprite(30, 190, "money").setScale(4);
		const lvlbtn = this.add.sprite(30, 260, "lvl").setScale(4);

		const ebtn = this.add.sprite(window.innerWidth - 180, window.innerHeight - 80, "e").setScale(6);
		const fbtn = this.add.sprite(window.innerWidth - 180, window.innerHeight - 230, "f").setScale(6);
		const qbtn = this.add.sprite(window.innerWidth - 50, window.innerHeight - 230, "q").setScale(6);
		const plusbtn = this.add.sprite(350, window.innerHeight - 350, "plus").setScale(6);
		const minusbtn = this.add.sprite(350, window.innerHeight - 50, "minus").setScale(6);
		const cambtn = this.add.sprite(50, window.innerHeight - 350, "cam").setScale(6);
		const inventorybtn = this.add.sprite(window.innerWidth - 50, window.innerHeight - 80, "inventory").setScale(6);
		const logoutbtn = this.add.sprite(window.innerWidth - 50, 50, "logout").setScale(6);

		this.healthText = this.add.text(80, 40, "", Functions.defaultTextStyle);
		this.xpText = this.add.text(80, 110, "0", Functions.defaultTextStyle);
		this.moneyText = this.add.text(80, 180, "0", Functions.defaultTextStyle);
		this.lvlText = this.add.text(80, 250, "1", Functions.defaultTextStyle);

		[ebtn, fbtn, qbtn, plusbtn, minusbtn, cambtn, inventorybtn, logoutbtn].forEach((btn) => btn.setInteractive({ useHandCursor: true }));

		// ------------------------------
		// Spieler-Inventar UI erstellen (einmal)
		// ------------------------------
		inventorybtn.on("pointerdown", () => this.toggleInventoryUI());

		// ------------------------------
		// Player ready
		// ------------------------------
		this.gameScene.events.on("localPlayerReady", (player) => {
			this.player = player;

			plusbtn.on("pointerdown", () => player.camera?.zoomIn());
			minusbtn.on("pointerdown", () => player.camera?.zoomOut());
			cambtn.on("pointerdown", () => player.camera?.toggleFreeMode());
			ebtn.on("pointerdown", () => player.interaction?.performAction("interact"));
			fbtn.on("pointerdown", () => player.interaction?.performAction("attack"));
			qbtn.on("pointerdown", () => player.interaction?.performAction("drop"));
		});

		// ------------------------------
		// Player stats events
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

		// ------------------------------
		// Socket Events
		// ------------------------------
		socket.on("chat:message", ({ playerName, message }) => {
			this.chatMessages.push(`${playerName}: ${message}`);
			if (this.chatMessages.length > 10) this.chatMessages.shift();
			this.chatText.setText(this.chatMessages.join("\n"));

			const player = this.gameScene.players[socket.id];
			if (player) player.showDialog(`${playerName}: ${message}`, 4000);
		});

		// NPC-Inventar öffnen
		socket.on("inventory:open:true", (npcInventoryData) => {
			const npcInventory = new Inventory(npcInventoryData.id, "buy");
			npcInventory.items = npcInventoryData.items;

			const invWidth = window.innerWidth * 0.35;
			const invHeight = window.innerHeight * 0.8;
			const spacing = 20;
			const startX = (window.innerWidth - (invWidth * 2 + spacing)) / 2;
			const startY = (window.innerHeight - invHeight) / 2;

			// Spieler-Inventar links
			//this.inventoryUI.setPosition(startX, startY);
			this.player.inventoryUI.type = "sell";
			this.player.inventoryUI.setLayout({
				size: "half",
				position: "left",
			});
			this.player.inventoryUI.toggle();
			this.player.inventoryUI.refresh();

			// NPC-Inventar rechts
			if (this.otherinventoryUI) this.otherinventoryUI.destroy();
			this.otherinventoryUI = new InventoryUI(this, npcInventory, {
				size: "half",
				position: "right",
			});
			this.otherinventoryUI.type = "buy";
			this.otherinventoryUI.toggle();
			this.otherinventoryUI.refresh();
		});

		// NPC-Inventar aktualisieren
		socket.on("inventory:other:refresh", (npcInventoryData) => {
			if (this.otherinventoryUI) {
				this.otherinventoryUI.inventory.items = npcInventoryData.items;
				this.otherinventoryUI.refresh();
			}
		});

		// Logout Button
		logoutbtn.on("pointerdown", async () => {
			try {
				const API_BASE = import.meta.env.PROD
					? `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_API_URL}`
					: `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_HOST_SERVER}:${import.meta.env.VITE_API_PORT}`;

				await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
			} catch (err) {
				console.error("Logout failed:", err);
			} finally {
				if (this.scene.isActive("UIScene")) this.scene.stop("UIScene");
				if (this.scene.isActive("GameScene")) this.scene.stop("GameScene");
				socket.emit("playerlogout", "Player Logged out");
				if (this.onLogout) this.onLogout();
			}
		});
	}

	// =================================================
	// INVENTORY
	// =================================================
	toggleInventoryUI() {
		if (!this.player) return;
		this.player.inventoryUI.toggle();
	}

	// =================================================
	// JOYSTICK
	// =================================================
	createJoystick() {
		const radius = 160;
		const innerRadius = 80;
		const cx = 150;
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
			const max = 120;
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
		this.joyStick.fillCircle(x, y, 80);
	}

	getJoystickVector() {
		return this.joystickVector;
	}

	// =================================================
	// CHAT
	// =================================================
	createChatUI() {
		const width = 300;
		const height = 200;

		this.chatContainer = this.add.container(10, window.innerHeight - 600).setDepth(1200);
		this.chatContainer.setVisible(false);

		const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0, 0);
		this.chatContainer.add(bg);

		this.chatText = this.add.text(5, 5, "", { fontSize: "14px", color: "#fff", wordWrap: { width: width - 10 } });
		this.chatContainer.add(this.chatText);

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
		if (this.chatInput) this.chatInput.style.display = this.chatContainer.visible ? "block" : "none";
	}
}
