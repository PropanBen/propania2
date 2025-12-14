// src/scenes/gamescene.js
import Phaser from "phaser";
import { socket } from "../socket.js";

import Player from "../entities/player.js";
import Item from "../entities/items.js";
import Inventory from "../entities/inventory";
import Resource from "../entities/resources.js";

import { preloadAssets } from "../assets/utils/gamesceneassetloader.js";
import { registerPlayerAnimations } from "../assets/utils/animations.js";

export default class GameScene extends Phaser.Scene {
	constructor() {
		super("GameScene");
		this.players = {};
		this.resources = {};
		this.worldItems = {};
	}

	init(data) {
		this.playerData = data.player;
		this.playerData.socket_id = socket.id;
	}

	preload() {
		preloadAssets(this);
	}

	create() {
		this.scene.launch("UIScene");
		// Groups
		this.playerGroup = this.physics.add.group();
		this.itemsGroup = this.physics.add.staticGroup();
		this.resourcesGroup = this.physics.add.staticGroup();
		this.interactablesGroup = this.physics.add.staticGroup();

		// Tilemap und Layer

		const map = this.make.tilemap({ key: "map" });
		const groundTiles = map.addTilesetImage("Ground", "ground");
		const groundLayer = map.createLayer("Ground", groundTiles, 0, 0);
		groundLayer.setDepth(0);
		groundLayer.setScale(4);
		this.groundLayer = groundLayer;

		// Input keys
		this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
		this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
		this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

		this.interactText = this.add
			.text(0, 0, "[E] Pick up", {
				fontSize: "14px",
				fontStyle: "bold",
				color: "#ffffffff",
				padding: { x: 6, y: 2 },
			})
			.setOrigin(0.5)
			.setDepth(1000)
			.setVisible(false)
			.setScrollFactor(1);

		registerPlayerAnimations(this);

		// ------------------------------
		// Socket Events
		// ------------------------------

		// Player Events
		socket.on("currentPlayers", (players) => {
			Object.values(players).forEach((p) => this.addPlayer(p, p.socket_id === socket.id));
		});

		socket.on("newPlayer", (playerInfo) => {
			this.addPlayer(playerInfo, false);
		});

		socket.on("updatePlayers", (playerData) => {
			const existing = this.players[playerData.socket_id];
			if (existing && !existing.isLocal()) {
				// Position setzen
				existing.setPosition(playerData.x, playerData.y);

				// Animation abspielen
				if (existing.animation) {
					existing.animation.playAnimation(playerData.anim);
				}

				// NameText mitziehen
				if (existing.nameText) {
					existing.nameText.setPosition(playerData.x, playerData.y - 40);
				}
			}
		});

		socket.on("playerDisconnected", (socket_id) => {
			if (this.players[socket_id]) {
				this.players[socket_id].destroy();
				delete this.players[socket_id];
			}
		});

		socket.on("world:items:update", (itemData) => {
			this.worldItems = {};
			this.itemsGroup.clear();
			this.clearByClass(Item);
			itemData.forEach((item) => {
				// info: { id, item_id, key, name, x, y, quantity }
				const obj = { id: item.id, item_id: item.item_id, key: item.key, x: item.x, y: item.y, quantity: item.quantity };
				this.AddItem(obj);
			});
		});

		socket.on("world:item:add", (item) => {
			const newitem = this.AddItem(item);
		});

		socket.on("world:item:removed", (world_item_id) => {
			const item = this.worldItems[world_item_id];
			item.destroy();
		});

		// ------------------------------
		// Inventory Events
		// ------------------------------

		socket.on("inventory:update:items", (items) => {
			// Gets Data after  socket.emit("inventory:load");
			if (this.localPlayer) this.localPlayer.inventory.loadFromServer(items);
			if (this.scene.get("UIScene").inventoryUI) this.scene.get("UIScene").inventoryUI.refresh();
		});

		socket.on("inventory:item:remove", () => {
			socket.emit("inventory:load");
		});

		this.events.on("inventory:ready", () => {
			socket.emit("inventory:load");
		});

		socket.on("world_resources_update", (resources) => {
			this.clearByClass(Resource);
			this.resourcesGroup.clear();
			// Ressourcen hinzufügen
			this.addResources(resources);
		});

		socket.on("world_resource:removed", (world_resource_id) => {
			const res = this.resources[world_resource_id];
			if (res) {
				this.resourcesGroup.remove(res, true, true);
				this.interactablesGroup.remove(res, true, true);
				res.destroy();
				delete this.resources[world_resource_id];
			}
		});

		// ------------------------------
		// End Socket Events
		// ------------------------------

		// Load local player
		socket.emit("playerJoin", this.playerData);
		//Load world items
		socket.emit("world:items:load");
		// Laod Resources
		socket.emit("world:resources:load");
	}

	update() {
		if (this.localPlayer) this.localPlayer.update();

		if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
			this.localPlayer.interaction.performAction("interact");
		}
		if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
			this.localPlayer.interaction.performAction("drop");
		}
		if (Phaser.Input.Keyboard.JustDown(this.keyI) && this.localPlayer) {
			this.events.emit("toggleInventory", this.localPlayer.inventory);
		}

		this.updateDepthSorting();
	}

	addPlayer(playerInfo, isLocal) {
		const player = new Player(this, playerInfo);
		//this.players[socket.id] = player;
		this.players[playerInfo.socket_id] = player;
		this.playerGroup.add(player);

		this.physics.add.collider(player, this.playerGroup);
		//	this.physics.add.collider(player, this.itemsGroup);
		this.physics.add.collider(player, this.resourcesGroup);

		if (isLocal) this.localPlayer = player;
		if (this.localPlayer) this.events.emit("localPlayerReady", player);
		if (this.localPlayer) socket.emit("inventory:load");
	}

	AddItem(info) {
		// info: { id, item_id, key, name, x, y, quantity }
		const item = new Item(this, info);
		this.worldItems[info.id] = item;
		item.world_item_id = info.id;
		this.itemsGroup.add(item);
		this.interactablesGroup.add(item);

		return item;
	}

	addResources(resources) {
		resources.forEach((res) => {
			if (!this.resources[res.id]) {
				const resourceObj = new Resource(this, res);
				this.resources[res.id] = resourceObj;
				this.resourcesGroup.add(resourceObj);
				this.interactablesGroup.add(resourceObj);
			}
		});
	}

	clearByClass(classType) {
		this.interactablesGroup.getChildren().forEach((child) => {
			if (child instanceof classType) {
				// Aus Gruppe entfernen und zerstören
				this.interactablesGroup.remove(child, true, true);
			}
		});
	}

	updateDepthSorting() {
		if (this.groundLayer) {
			this.groundLayer.setDepth(0);
		}

		// Alle beweglichen Sprites: Spieler, Items, Ressourcen
		const movableSprites = [
			...Object.values(this.players),
			...this.playerGroup.getChildren(),
			...this.itemsGroup.getChildren(),
			...this.resourcesGroup.getChildren(),
		];

		// Sortiere nach "Bodenhöhe" (y + body.height)
		movableSprites.sort((a, b) => {
			const ay = a.body ? a.body.y + a.body.height : a.y + (a.height || 0);
			const by = b.body ? b.body.y + b.body.height : b.y + (b.height || 0);
			return ay - by;
		});

		// Depth setzen
		movableSprites.forEach((sprite, index) => {
			sprite.setDepth(10 + index);
			if (sprite.nameText) {
				sprite.nameText.setDepth(1000 + index);
			}
			// Optional: QuantityText oder Labels bei Items
			if (sprite.quantityText) {
				sprite.quantityText.setDepth(1000 + index);
			}
		});
	}
}
