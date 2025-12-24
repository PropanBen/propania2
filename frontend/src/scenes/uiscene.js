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

		// Für smooth Zoom
		this.zoomInPressed = false;
		this.zoomOutPressed = false;
	}

	create() {
		this.socket = socket;
		this.gameScene = this.scene.get("GameScene");
		this.chatMessages = [];
		this.createHTMLUI();
		this.createChatUI();

		// ------------------------------
		// Player ready
		// ------------------------------
		this.gameScene.events.on("localPlayerReady", (player) => {
			this.player = player;

			// Smooth Zoom Buttons
			this.bindHoldButton(
				"btn-zoom-in",
				() => (this.zoomInPressed = true),
				() => (this.zoomInPressed = false)
			);
			this.bindHoldButton(
				"btn-zoom-out",
				() => (this.zoomOutPressed = true),
				() => (this.zoomOutPressed = false)
			);

			this.bindButton("btn-cam", () => player.camera?.toggleFreeMode());
			this.bindButton("btn-e", () => player.interaction?.performAction("interact"));
			this.bindButton("btn-f", () => player.interaction?.performAction("attack"));
			this.bindButton("btn-q", () => player.interaction?.performAction("drop"));
			this.bindButton("btn-inventory", () => this.toggleInventoryUI());
		});

		// ------------------------------
		// Player stats events
		// ------------------------------
		this.game.events.on("playerHealthChanged", (h) => this.setText("stat-hp", `${h}/100`));
		this.game.events.on("playerMoneyChanged", (m) => this.setText("stat-money", m));
		this.game.events.on("playerExpChanged", (xp) => this.setText("stat-xp", xp));
		this.game.events.on("playerLevelChanged", (lvl) => this.setText("stat-lvl", lvl));

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

		socket.on("inventory:open:true", (npcInventoryData) => {
			const npcInventory = new Inventory(npcInventoryData.id, "buy");
			npcInventory.items = npcInventoryData.items;

			// Spieler-Inventar links
			this.player.inventoryUI.type = "sell";
			this.player.inventoryUI.setLayout({ size: "half", position: "left" });
			this.player.inventoryUI.toggle();
			this.player.inventoryUI.refresh();

			// NPC-Inventar rechts
			if (this.otherinventoryUI) this.otherinventoryUI.destroy();
			this.otherinventoryUI = new InventoryUI(this, npcInventory, { size: "half", position: "right" });
			this.otherinventoryUI.type = "buy";
			this.otherinventoryUI.toggle();
			this.otherinventoryUI.refresh();
		});

		socket.on("inventory:other:refresh", (npcInventoryData) => {
			if (this.otherinventoryUI) {
				this.otherinventoryUI.inventory.items = npcInventoryData.items;
				this.otherinventoryUI.refresh();
			}
		});

		// Logout Button
		this.bindButton("btn-logout", async () => {
			try {
				const API_BASE = import.meta.env.PROD
					? `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_API_URL}`
					: `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_HOST_SERVER}:${import.meta.env.VITE_API_PORT}`;
				await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
			} finally {
				this.cleanupHTML();
				this.scene.stop("UIScene");
				this.scene.stop("GameScene");
				socket.emit("playerlogout");
				this.onLogout?.();
			}
		});
	}

	// =================================================
	// Smooth Zoom Buttons
	// =================================================
	bindHoldButton(id, onDown, onUp) {
		const el = document.getElementById(id);
		if (!el) return;

		el.addEventListener("pointerdown", (e) => {
			e.preventDefault();
			onDown();
		});
		el.addEventListener("pointerup", (e) => {
			e.preventDefault();
			onUp();
		});
		el.addEventListener("pointerleave", () => onUp());
		el.addEventListener("touchstart", (e) => {
			e.preventDefault();
			onDown();
		});
		el.addEventListener("touchend", (e) => {
			e.preventDefault();
			onUp();
		});
	}

	// =================================================
	// Update Loop
	// =================================================
	update(time, delta) {
		if (this.player?.camera) {
			const zoomSpeed = 0.001 * delta; // fein anpassen für smooth Zoom
			let newZoom = this.player.camera.camera.zoom;

			if (this.zoomInPressed) newZoom += zoomSpeed;
			if (this.zoomOutPressed) newZoom -= zoomSpeed;

			// Zoom-Limits
			newZoom = Phaser.Math.Clamp(newZoom, 0.5, 6);
			this.player.camera.camera.setZoom(newZoom);
		}
	}

	// =================================================
	// Joystick
	// =================================================
	createJoystick() {
		const maxDiameter = 150;
		const baseOffset = 20;
		const baseStickRatio = 0.5;
		const offsetX = 40;
		const offsetY = 60;

		const updateJoystickLayout = () => {
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const radius = Math.min(maxDiameter / 2, vw * 0.08);
			const innerRadius = radius * baseStickRatio;
			const cx = baseOffset + radius + offsetX;
			const cy = vh - baseOffset - radius - offsetY;
			return { radius, innerRadius, cx, cy };
		};

		let { radius, innerRadius, cx, cy } = updateJoystickLayout();

		this.joyBG = this.add.graphics();
		this.joyBG.fillStyle(0x000000, 0.5);
		this.joyBG.fillCircle(cx, cy, radius);
		this.joyBG.setScrollFactor(0);

		this.joyStick = this.add.graphics();
		this.joyStick.fillStyle(0xffffff, 0.6);
		this.joyStick.fillCircle(cx, cy, innerRadius);
		this.joyStick.setScrollFactor(0);

		this.joyCenter = { x: cx, y: cy };
		this.joystickVector = { x: 0, y: 0 };
		this.joystickActive = false;

		this.input.on("pointerdown", (p) => {
			const dist = Phaser.Math.Distance.Between(p.x, p.y, cx, cy);
			if (dist < radius + 20) this.joystickActive = true;
		});

		this.input.on("pointerup", () => {
			this.joystickActive = false;
			this.updateStickGraphics(cx, cy, innerRadius);
			this.joystickVector = { x: 0, y: 0 };
		});

		this.input.on("pointermove", (p) => {
			if (!this.joystickActive) return;
			const dx = p.x - cx;
			const dy = p.y - cy;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const max = radius * 0.75;
			const clamped = Math.min(max, dist);
			const angle = Math.atan2(dy, dx);
			const stickX = cx + Math.cos(angle) * clamped;
			const stickY = cy + Math.sin(angle) * clamped;
			this.updateStickGraphics(stickX, stickY, innerRadius);

			this.joystickVector = {
				x: Math.cos(angle) * (clamped / max),
				y: Math.sin(angle) * (clamped / max),
			};
		});

		this.scale.on("resize", () => {
			const layout = updateJoystickLayout();
			radius = layout.radius;
			innerRadius = layout.innerRadius;
			cx = layout.cx;
			cy = layout.cy;
			this.joyCenter = { x: cx, y: cy };
			this.joyBG.clear();
			this.joyBG.fillStyle(0x000000, 0.5);
			this.joyBG.fillCircle(cx, cy, radius);
			this.updateStickGraphics(cx, cy, innerRadius);
		});
	}

	updateStickGraphics(x, y, innerRadius) {
		this.joyStick.clear();
		this.joyStick.fillStyle(0xffffff, 0.6);
		this.joyStick.fillCircle(x, y, innerRadius);
	}

	getJoystickVector() {
		return this.joystickVector;
	}

	// =================================================
	// HTML UI
	// =================================================
	createHTMLUI() {
		this.uiRoot = document.createElement("div");
		this.uiRoot.id = "ui-root";
		document.body.appendChild(this.uiRoot);

		this.uiRoot.innerHTML = `
			<div id="container-stats">
				<div><img id="icon-hp" src="/src/assets/ui/hp.png" /> <span id="stat-hp">0</span></div>
				<div><img id="icon-xp" src="/src/assets/ui/xp.png" /><span id="stat-xp">0</span></div>
				<div><img id="icon-money" src="/src/assets/ui/money.png" /><span id="stat-money">0</span></div>
				<div><img id="icon-lvl" src="/src/assets/ui/lvl.png" /><span id="stat-lvl">1</span></div>
			</div>
			<div id="container-control-buttons">
				<img id="btn-cam" src="/src/assets/ui/cam.png" />
				<img id="btn-zoom-in" src="/src/assets/ui/plus.png" />
				<img id="btn-zoom-out" src="/src/assets/ui/minus.png" />
			</div>
			<div id="container-action-buttons">
				<img id="btn-e" src="/src/assets/ui/e.png" class="big"/>
				<img id="btn-f" src="/src/assets/ui/f.png" class="big"/>
				<img id="btn-q" src="/src/assets/ui/q.png" />
				<img id="btn-inventory" src="/src/assets/ui/inventory.png" />
			</div>
			<div id="container-logout">
				<img id="btn-logout" src="/src/assets/ui/logout.png" />
			</div>
		`;
	}

	// =================================================
	// CHAT
	// =================================================
	createChatUI() {
		this.chatMessages = [];

		this.chatBox = document.createElement("div");
		this.chatBox.id = "chat-box";
		this.chatBox.style.display = "none";

		this.chatText = document.createElement("pre");
		this.chatBox.appendChild(this.chatText);

		this.chatInput = document.createElement("input");
		this.chatInput.type = "text";

		this.chatInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				const msg = this.chatInput.value.trim();
				if (msg) socket.emit("chat:message", msg);
				this.chatInput.value = "";
			}
		});

		document.body.appendChild(this.chatBox);
		document.body.appendChild(this.chatInput);
	}

	// =================================================
	// Hilfsfunktionen
	// =================================================
	bindButton(id, fn) {
		const el = document.getElementById(id);
		if (el) el.onclick = fn;
	}

	setText(id, value) {
		const el = document.getElementById(id);
		if (el) el.innerText = value;
	}

	cleanupHTML() {
		this.uiRoot?.remove();
		this.chatInput?.remove();
	}

	toggleInventoryUI() {
		if (!this.player) return;
		this.player.inventoryUI.toggle();
	}

	toggleChat() {
		const visible = this.chatBox.style.display === "none";
		this.chatBox.style.display = visible ? "block" : "none";
		this.chatInput.style.display = visible ? "block" : "none";
	}
}
