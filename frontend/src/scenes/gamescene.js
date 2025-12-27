// src/scenes/gamescene.js
import Phaser from "phaser";
import { socket } from "../socket.js";
import Player from "../entities/player.js";
import NPC from "../entities/npc.js";
import Animal from "../entities/animal.js";
import Item from "../entities/items.js";
import Resource from "../entities/resources.js";
import WorldObject from "../entities/worldobjects.js";
import { itemRegistry } from "../entities/itemregistry.js";

import { preloadAssets } from "../assets/utils/gamesceneassetloader.js";
import { registerPlayerAnimations, registerAnimalAnimations } from "../assets/utils/animations.js";

export default class GameScene extends Phaser.Scene {
	constructor() {
		super("GameScene");
		this.players = {};
		this.resources = {};
		this.worldItems = {};
		this.animals = {};
		this.professions = {};
	}

	init(data) {
		this.playerData = data.player;
		this.playerData.socket_id = socket.id;
	}

	preload() {
		preloadAssets(this);
	}

	create() {
		if (this.sys.game.device.os.android || this.sys.game.device.os.iOS) {
			this.sys.game.renderer.resolution = 1;
		}
		this.scene.launch("UIScene");
		// Groups
		this.playerGroup = this.physics.add.group();
		this.npcGroup = this.physics.add.group();
		this.animalGroup = this.physics.add.group();
		this.itemsGroup = this.physics.add.staticGroup();
		this.resourcesGroup = this.physics.add.staticGroup();
		this.interactablesGroup = this.physics.add.staticGroup();
		this.worldobjectsGroup = this.physics.add.staticGroup();

		// Tilemap und Layer

		const mapbg = this.add.rectangle(-7936, -7936, 15872, 15872, 0x6fbd29, 1).setOrigin(0);
		mapbg.setDepth(-1);

		const map = this.make.tilemap({ key: "map" });
		const groundTiles = map.addTilesetImage("Gras_Spritesheet", "ground");
		const groundLayer = map.createLayer("ground", groundTiles, 0, 0);

		groundLayer.setDepth(0);
		//groundLayer.setRoundPixels(true);
		this.groundLayer = groundLayer;

		const mapWidth = map.widthInPixels;
		const mapHeight = map.heightInPixels;

		this.textures.get("ground").setFilter(Phaser.Textures.FilterMode.NEAREST);

		// Map zentrieren → (0|0) = Mitte
		groundLayer.setPosition(Math.floor(-mapWidth / 2), Math.floor(-mapHeight / 2));

		// World Bounds (NUR EINMAL!)
		this.physics.world.setBounds(-mapWidth / 2, -mapHeight / 2, mapWidth, mapHeight, true, true, true, true);

		// Camera Bounds (wichtig!)
		//	this.cameras.main.setBounds(-mapWidth / 2, -mapHeight / 2, mapWidth, mapHeight);
		this.cameras.main.roundPixels = true;
		this.cameras.main.setRoundPixels(true);

		// Input keys
		this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
		this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
		this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
		this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
		this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
		this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

		this.interactText = this.add
			.text(0, 0, "[E] Pick up", {
				fontSize: "10px",
				fontStyle: "bold",
				color: "#000000ff",
				resolution: 4,
				padding: { x: 6, y: 2 },
			})
			.setOrigin(0.5)
			.setDepth(1000)
			.setVisible(false)
			.setScrollFactor(1);

		registerPlayerAnimations(this);
		registerAnimalAnimations(this);

		//NPCs

		this.merchant = new NPC(this, 0, 1000, "merchant", "Merchant", "trader", "start_merchant");
		this.merchant.setScale(0.8);

		this.merchantcart = new WorldObject(this, 200, 1000, "merchantcart", "cart");

		// Animals

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

		// World Items

		socket.on("world:items:update", (itemData) => {
			this.worldItems = {};
			if (this.itemsGroup && !this.itemsGroup.destroyed) {
				this.itemsGroup.clear(true, true);
			}
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

		// Items Registry
		socket.on("itemslist:update", (items) => {
			itemRegistry.loadAll(items);
		});
		// ------------------------------
		// Inventory Events
		// ------------------------------

		socket.on("inventory:update:items", (data) => {
			if (!this.localPlayer) return;

			// 🔐 INVENTAR FILTERN
			if (data.inventory_id !== this.localPlayer.inventory.inventory_id) return;

			this.localPlayer.inventory.loadFromServer(data);

			this.localPlayer.inventoryUI.refresh();
		});

		socket.on("inventory:item:remove", () => {
			socket.emit("inventory:load");
		});

		this.events.on("inventory:ready", () => {
			socket.emit("inventory:load");
		});

		socket.on("world_resources_update", (resources) => {
			this.clearByClass(Resource);
			if (this.resourcesGroup && !this.resourcesGroup.destroyed) {
				this.resourcesGroup.clear(true, true);
			}
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

		socket.on("animals:update", (animals) => {
			this.AddAnimal(animals);
		});

		socket.on("animal:update", (data) => {
			const animal = this.animals[data.id];
			if (!animal) return;

			animal.syncFromServer(data);
		});

		//Professions
		socket.on("professions:loaded", (data) => {
			this.professions = data;
		});

		socket.on("professions:player.loaded", (data) => {
			this.localPlayer.ProfessionsMenu.playerprofessions = data;
		});

		// Dialogbox
		socket.on("Show:Dialogbox", (text) => {
			this.localPlayer.showDialog(text);
		});

		//Sounds
		socket.on("Play:Sound:Coin", () => {
			this.sound.play("coin");
		});
		socket.on("Play:Sound:Drop", () => {
			this.sound.play("drop");
		});

		socket.on("Play:Sound:Pop", () => {
			this.sound.play("pop");
		});

		// ------------------------------
		// On Scene Shutdown deregister Socket Events
		// ------------------------------

		this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
			socket.off("currentPlayers");
			socket.off("newPlayer");
			socket.off("updatePlayers");
			socket.off("playerDisconnected");
			socket.off("world:items:update");
			socket.off("world:item:add");
			socket.off("world:item:removed");
			socket.off("world_resources_update");
			socket.off("world_resource:removed");
		});

		// ------------------------------
		// End Socket Events
		// ------------------------------

		// Load local player
		socket.emit("playerJoin", this.playerData);
		//Load Items Registry
		socket.emit("itemslist:request");
		//Load world items
		socket.emit("world:items:load");
		// Load Resources
		socket.emit("world:resources:load");
		// Load Animals
		socket.emit("world:animals:load");
		// Load Professions
		socket.emit("professions:load");
	}

	update() {
		if (this.localPlayer) this.localPlayer.update();

		if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
			this.localPlayer.interaction.performAction("interact");
		}
		if (Phaser.Input.Keyboard.JustDown(this.keyF)) {
			this.localPlayer.interaction.performAction("attack");
		}
		if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
			this.localPlayer.interaction.performAction("drop");
		}
		if (Phaser.Input.Keyboard.JustDown(this.keyI) && this.localPlayer) {
			this.localPlayer.inventoryUI.type = "drop";
			this.game.events.emit("toggleInventory", this.localPlayer.inventory);
		}
		if (Phaser.Input.Keyboard.JustDown(this.keyT) && this.localPlayer) {
			this.game.events.emit("toggleChat");
		}

		if (Phaser.Input.Keyboard.JustDown(this.keyP) && this.localPlayer) {
			this.localPlayer.ProfessionsMenu.toggle();
		}

		this.animalGroup.getChildren().forEach((animal) => animal.update());

		this.updateDepthSorting();
	}

	addPlayer(playerInfo, isLocal) {
		if (!this.scene.isActive()) return;
		if (!this.playerGroup) return;

		const player = new Player(this, playerInfo);
		this.players[playerInfo.socket_id] = player;
		this.playerGroup.add(player);
		this.physics.add.collider(player, this.playerGroup);
		this.physics.add.collider(player, this.npcGroup);
		this.physics.add.collider(player, this.animalGroup);
		this.physics.add.collider(player, this.resourcesGroup);
		this.physics.add.collider(player, this.worldobjectsGroup);

		if (isLocal) {
			this.localPlayer = player;
			this.events.emit("localPlayerReady", player);
			socket.emit("inventory:load");
		}
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

	AddAnimal(animals) {
		animals.forEach((data) => {
			if (!this.animals[data.id]) {
				const animal = new Animal(this, data);
				this.animals[data.id] = animal;
			}
		});
	}

	clearByClass(classType) {
		if (!this.interactablesGroup || this.interactablesGroup.destroyed) return;

		const children = this.interactablesGroup.getChildren();
		if (!children) return;

		children.forEach((child) => {
			if (child instanceof classType) {
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
			...this.playerGroup.getChildren(),
			...this.npcGroup.getChildren(),
			...this.animalGroup.getChildren(),
			...this.itemsGroup.getChildren(),
			...this.resourcesGroup.getChildren(),
			...this.worldobjectsGroup.getChildren(),
		].filter((s) => s && s.active && s.body);

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
