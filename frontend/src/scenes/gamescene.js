// src/scenes/gamescene.js
import Player from "../entities/player.js";
import { socket } from "../socket.js";
import Phaser from "phaser";
import { preloadAssets } from "../assets/utils/gamesceneassetloader.js";
import { registerPlayerAnimations } from "../assets/utils/animations.js";

import Item from "../entities/items.js";
import Inventory from "../entities/inventory";
import Resource from "../entities/resources.js";

export default class GameScene extends Phaser.Scene {
	constructor(data) {
		super("GameScene");
		this.player = null;
	}

	init(data) {
		this.player_id = data?.player_id ?? null;
		this.account_id = data?.account_id ?? null;
	}

	preload() {
		// Stelle sicher, dass im Asset-Loader der 'mushroom'-Sprite vorhanden ist:
		preloadAssets(this);
	}

	create() {
		this.socket = socket;
		this.players = {};
		this.playerGroup = this.physics.add.group();
		this.itemsGroup = this.physics.add.staticGroup(); // Welt-Items
		this.itemsById = {}; // world_item_id -> Item Sprite
		this.inventory = new Inventory(this);
		this.resourcesDefinitions = {}; // resource_id -> { id, key, name }
		this.resources = {};
		this.resourcesGroup = this.physics.add.staticGroup();
		this.buildingsGroup = this.physics.add.staticGroup();

		registerPlayerAnimations(this);

		// Map
		const map = this.make.tilemap({ key: "map" });
		const groundTiles = map.addTilesetImage("Ground", "ground");
		const groundLayer = map.createLayer("Ground", groundTiles, 0, 0);
		groundLayer.setDepth(10);
		groundLayer.setScale(4);

		// Kollisionen
		this.physics.add.collider(this.playerGroup, this.playerGroup);
		this.physics.add.collider(this.playerGroup, this.resourcesGroup);
		this.physics.add.collider(this.playerGroup, this.buildingsGroup);

		// HUD: Aufheben-Hinweis
		this.interactText = this.add
			.text(0, 0, "[E] Pick up", {
				fontSize: "14px",
				fontStyle: "bold",
				color: "#ffffffff",
				//backgroundColor: 'rgba(0,0,0,0.35)',
				padding: { x: 6, y: 2 },
			})
			.setOrigin(0.5)
			.setDepth(1000)
			.setVisible(false)
			.setScrollFactor(1);

		// Eingaben
		this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
		this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
		this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

		// Socket Events
		this.socket.on("currentPlayers", (players) => {
			Object.values(players).forEach((player) => {
				this.addPlayer(player, player.socket_id === this.socket.id);
			});
		});

		this.socket.on("newPlayer", (playerInfo) => {
			this.addPlayer(playerInfo, false);
		});

		this.socket.on("updatePlayers", (player) => {
			const existing = this.players[player.socket_id];
			if (existing && !existing.isLocalPlayer) {
				existing.setPosition(player.x, player.y);

				if (existing.currentAnim !== player.anim) {
					existing.play(player.anim, true);
					existing.currentAnim = player.anim;
				}
			}
		});

		this.socket.on("playerDisconnected", (socket_id) => {
			if (this.players[socket_id]) {
				this.players[socket_id].nameText.destroy();
				this.players[socket_id].destroy();
				delete this.players[socket_id];
			}
		});

		// Welt-Items initial + Live-Änderungen
		this.socket.on("world:items:init", (items) => {
			this.itemsGroup.clear(true, true);
			items.forEach((info) => this.spawnItem(info));
		});

		// === world:resources:init ===
		this.socket.on("world:resources:init", (resources) => {
			this.resourcesDefinitions = resources["resourcesDefinitions"];
			this.resources = resources["worldResources"];

			Object.values(this.resources).forEach((resource) => {
				const def = this.resourcesDefinitions.find((x) => x.id === resource.resource_id);
				if (def) {
					resource.key = def.key ?? "Unknown";
					resource.name = def.name ?? "Unknown";

					const r = new Resource(this, resource);
					this.resourcesGroup.add(r);
				}
			});
		});

		this.socket.on("item:spawned", (info) => {
			this.spawnItem(info);
		});

		this.socket.on("item:removed", (world_item_id) => {
			const sprite = this.itemsById[world_item_id];
			if (sprite) {
				sprite.destroy();
				delete this.itemsById[world_item_id];
			}
			if (this.nearItemId === world_item_id) {
				this.nearItemId = null;
				this.interactText.setVisible(false);
			}
		});

		// Inventar-Updates nur für lokalen Spieler
		this.socket.on("inventory:update", (payload) => {
			this.inventory.setFromServer(payload);
		});

		// Fehlerfeedback (optional)
		this.socket.on("item:error", (err) => {
			console.warn("Item Error:", err?.message ?? err);
		});

		// Nach Verbindung -> Init anfordern
		this.socket.emit("world:init:request", { player_id: this.player_id });

		this.socket.on("world:resources:update", (world_resource_id) => {
			const toRemove = this.resourcesGroup.getChildren().find((r) => r.world_resource_id === world_resource_id);
			if (toRemove) {
				toRemove.destroy();
			}
			this.resources = this.resources.filter((r) => r.id !== world_resource_id);
		});
	}

	addPlayer(playerInfo, isLocal) {
		const player = new Player(this, playerInfo, isLocal);
		this.players[player.socket_id] = player;
		this.playerGroup.add(player);

		if (isLocal) {
			this.player = player;

			this.physics.add.overlap(
				player.actionzone,
				this.resourcesGroup,
				(zone, resource) => {
					if (player.actionzoneTarget == resource) return;
					player.actionzoneTarget = resource;
				},
				null,
				this
			);

			this.physics.add.overlap(
				this.player.actionzone,
				this.itemsGroup,
				(actionzone, itemSprite) => {
					this.nearItemId = itemSprite.world_item_id;
					this.interactText
						.setText("[E] Aufheben")
						.setPosition(itemSprite.x, itemSprite.y - 30)
						.setVisible(true);
				},
				null,
				this
			);
		}
	}
	spawnItem(info) {
		// info: { id, item_id, key, name, x, y, quantity }
		const item = new Item(this, info);
		this.itemsGroup.add(item);
		this.itemsById[item.world_item_id] = item;

		return item;
	}

	tryPickup() {
		if (!this.nearItemId) return;

		this.socket.emit("item:pickup:request", {
			world_item_id: this.nearItemId,
			player_id: this.player_id,
			actionzone: this.player.actionzone,
		});
		this.interactText.setVisible(false);
		this.nearItemId = null;

		// 👇 Lokalen Spieler Aufheben-Animation abspielen lassen
		const you = this.players[this.socket.id];
		if (you && you.isLocalPlayer) {
			you.playActionAnimation("pickup", 600);
		}

		const config = { delay: 0.4 };
		this.sound.play("pop", config);
	}

	tryDrop() {
		const you = this.players[this.socket.id];
		if (!you) return;
		const it = this.inventory.getFirstDroppableItem();
		if (!it) return;
		const dropPosition = you.setDropPostion(you.lastDirection);
		this.socket.emit("item:drop:request", {
			item_id: it.item_id,
			quantity: 1,
			dropPosition,
			player_id: this.player_id,
		});
		// 👇 Lokalen Spieler Fallenlassen-Animation abspielen lassen
		if (you && you.isLocalPlayer) {
			you.playActionAnimation("drop", 600);
			const config = { delay: 0.7 };
			this.sound.play("drop", config);
		}
	}

	chooseAction() {
		if (this.nearItemId) return this.tryPickup();
		if (this.player.actionzoneTarget != null) return this.player.playActionAnimation(this.player.actionzoneTarget.key, 1000);
	}

	update() {
		if (!this.player) return;

		if (this.player.actionzoneTarget) {
			const touching = this.physics.overlap(this.player.actionzone, this.player.actionzoneTarget);
			if (!touching) {
				this.player.actionzoneTarget = null;
			}
		}

		// Spieler-Update
		if (this.players[this.socket.id]) {
			this.players[this.socket.id].update();
		}

		// Eingaben
		if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.chooseAction();
		if (Phaser.Input.Keyboard.JustDown(this.keyQ)) this.tryDrop();
		if (Phaser.Input.Keyboard.JustDown(this.keyI)) this.inventory.toggleUI();

		// Interact-Hinweis verstecken, wenn man sich entfernt
		if (this.nearItemId) {
			const you = this.player.actionzone;
			const item = this.itemsById[this.nearItemId];
			if (!you || !item) {
				this.interactText.setVisible(false);
				this.nearItemId = null;
			} else {
				const dx = you.x - item.x;
				const dy = you.y - item.y;
				const dist2 = dx * dx + dy * dy;
				if (dist2 > 64 * 64) {
					this.interactText.setVisible(false);
					this.nearItemId = null;
				}
			}
		}
		// Spieler und Items nach Y sortieren
		this.updateDepthSorting();

		// Inventar-UI Position anpassen
		this.inventory.setInventoryPosition(16, 16);
	}

	updateDepthSorting() {
		const allSprites = [
			...Object.values(this.players),
			...this.itemsGroup.getChildren(),
			...this.buildingsGroup.getChildren(),
			...this.resourcesGroup.getChildren(),
		];

		allSprites.sort((a, b) => {
			// Nutze body y für Spieler, sonst sprite y
			const ay = a.body ? a.body.y + a.body.height : a.y;
			const by = b.body ? b.body.y + b.body.height : b.y;
			return ay - by;
		});

		allSprites.forEach((sprite, index) => {
			sprite.setDepth(10 + index);
			if (sprite.nameText) {
				sprite.nameText.setDepth(1000 + index);
			}
		});
	}
}
