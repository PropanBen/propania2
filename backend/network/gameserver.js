// server/game/gameserver.js

import {
	loadPlayerFromDB,
	updatePlayer,
	loadWorldItems,
	WorldItemExits,
	removeWorldItem,
	loadInventoryByInventoryId,
	addItemToInventory,
	removeItemFromInventory,
	createWorldItem,
	ItemExistsInInventory,
	loadWorldResources,
	getOrCreateInventory,
	withTransaction,
	PlayerRemoveMoney,
	PlayerAddMoney,
} from "../database/db.js";
import Functions from "../utils/functions.js";
import resourcesDrops from "../entities/resourcedrops.js";
import itemsList from "../entities/itemlist.js";

export function initGameServer(io) {
	const players = {};
	const worldItems = new Map();
	const worldResources = new Map();
	const npcInventories = new Map();

	async function ensureWorldItemsLoaded() {
		if (worldItems.size > 0) return;
		const items = await loadWorldItems();
		items.forEach((it) => worldItems.set(it.id, it));
	}

	io.on("connect_error", (err) => {
		console.error("Socket.IO connect_error:", err);
	});

	io.on("connection", async (socket) => {
		console.log(`Player connected: ${socket.id}`);

		function createMerchantNPC(id, name, x, y, items) {
			npcInventories.set(id, { id, name, x, y, items });
		}

		createMerchantNPC("start_merchant", "Baldur", 0, 1000, [
			{ item_id: 20, key: "pickaxe", name: "Pickaxe", quantity: 1, price: 100 },
			{ item_id: 21, key: "axe", name: "Axe", quantity: 1, price: 100 },
		]);

		// ------------------------------
		// Player Events
		// ------------------------------
		socket.on("playerJoin", async (playerInfo) => {
			const playerData = await loadPlayerFromDB(playerInfo.id);
			if (!playerData) return;

			// ✅ INVENTORY SERVERSEITIG ERMITTELN
			const inventory_id = await withTransaction(async (conn) => {
				return await getOrCreateInventory(conn, "player", playerData.id);
			});

			playerData.inventory_id = inventory_id;
			playerData.socket_id = socket.id;

			players[socket.id] = playerData;

			socket.emit("currentPlayers", players);
			socket.broadcast.emit("newPlayer", playerData);
		});

		socket.on("playerMovement", (data) => {
			const player = players[socket.id];
			if (!player) return;

			player.x = data.x;
			player.y = data.y;
			player.anim = data.anim;
			player.lastDirection = data.lastDirection;

			io.emit("updatePlayers", {
				socket_id: socket.id,
				x: data.x,
				y: data.y,
				anim: data.anim,
				lastDirection: data.lastDirection,
			});
		});

		socket.on("Request:Show:Dialogbox", (text) => {
			console.log(text);
			socket.emit("Show:Dialogbox", text);
			socket.broadcast.emit("Show:Dialogbox", text);
		});

		socket.on("disconnect", (reason) => {
			const player = players[socket.id];
			if (player) updatePlayer(player).catch(console.error);

			delete players[socket.id];
			io.emit("playerDisconnected", socket.id);

			console.log(`Player disconnected: ${socket.id}`, reason);
		});

		// ------------------------------
		// Inventory Events
		// ------------------------------

		//Inventory Load
		socket.on("inventory:load", async () => {
			const player = players[socket.id];
			if (!player) return;

			const inventory = await loadInventoryByInventoryId(player.inventory_id);

			socket.emit("inventory:update:items", inventory);
		});

		// Inventory Pickup
		socket.on("inventory:item:pickup", async (inventory_id, item, quantity) => {
			const player = players[socket.id];
			if (!player) return;

			// 🔐 Sicherheit
			if (inventory_id !== player.inventory_id) return;

			const exists = await WorldItemExits(item.world_item_id, quantity);
			if (!exists) return;

			await addItemToInventory(inventory_id, item.item_id, quantity);
			await removeWorldItem(item.world_item_id, quantity);

			const newInventory = await loadInventoryByInventoryId(inventory_id);
			socket.emit("inventory:update:items", newInventory);

			worldItems.delete(item.world_item_id);
			io.emit("world:item:removed", item.world_item_id);
		});

		//Inventory Inventory Item Drop
		socket.on("inventory:item:drop", async (inventory_id, item, quantity) => {
			const player = players[socket.id];
			if (!player) return;

			if (inventory_id !== player.inventory_id) return;

			const exists = await ItemExistsInInventory(inventory_id, item.item_id, quantity);
			if (!exists) return;

			await removeItemFromInventory(inventory_id, item.item_id, quantity);

			const dropPos = Functions.getDropPosition(player.x, player.y, player.lastDirection);
			const newWorldItem = await createWorldItem(item.item_id, dropPos.x, dropPos.y, quantity);

			worldItems.set(newWorldItem.id, newWorldItem);
			io.emit("world:item:add", newWorldItem);

			const updatedInventory = await loadInventoryByInventoryId(inventory_id);
			socket.emit("inventory:update:items", updatedInventory);
			socket.emit("Play:Sound:Drop");
		});

		// ------------------------------
		// Item Events
		// ------------------------------
		socket.on("world:items:load", async () => {
			await ensureWorldItemsLoaded();
			socket.emit("world:items:update", Array.from(worldItems.values()));
		});

		socket.on("world:item:spawn:request", async ({ resourceType, x, y }) => {
			const drops = resourcesDrops[resourceType];
			if (!drops) return;

			for (const drop of drops) {
				const chance = drop.chance ?? 1.0;
				if (Math.random() > chance) continue;

				const quantity = Functions.randomIntRange(drop.min, drop.max);
				if (quantity <= 0) continue;

				const item = await createWorldItem(
					drop.item_id,
					Functions.randomFloatRange(-50, +50) + x,
					Functions.randomFloatRange(-50, +50) + y,
					quantity
				);
				worldItems.set(item.id, item);

				socket.emit("world:item:add", item);
				socket.broadcast.emit("world:item:add", item);
			}
		});

		socket.on("inventory:item:buy", async (npcId, itemId, quantity) => {
			const player = players[socket.id];
			const npcInventory = npcInventories.get(npcId);
			if (!player || !npcInventory) return;

			const item = npcInventory.items.find((i) => i.item_id === itemId);
			if (!item || item.quantity < quantity) return;

			const totalPrice = item.price * quantity;

			// Spieler zuerst prüfen
			const result = await PlayerRemoveMoney(player.id, totalPrice);

			if (!result.success) {
				io.emit("Show:Dialogbox", "Not enough money. Current balance: " + result.newBalance);
				return;
			}

			// Geld erfolgreich abgezogen → Item hinzufügen
			await addItemToInventory(player.inventory_id, item.item_id, quantity);
			const updatedInventory = await loadInventoryByInventoryId(player.inventory_id);
			socket.emit("inventory:update:items", updatedInventory);
			socket.emit("player:money:update", result.newBalance);
			socket.emit("Play:Sound:Coin");
		});

		socket.on("inventory:item:sell", async (npcId, itemId, quantity) => {
			const player = players[socket.id];
			if (!player) return;

			// 1️⃣ Inventar frisch aus DB laden
			const inventory = await loadInventoryByInventoryId(player.inventory_id);
			if (!inventory || !inventory.items) return;

			// 2️⃣ Item im Inventar suchen
			const item = inventory.items.find((i) => i.item_id === itemId);
			if (!item || item.quantity < quantity) {
				socket.emit("Show:Dialogbox", "Not enough items to sell.");
				return;
			}

			const itemDef = itemsList.find((i) => Number(i.item_id) === Number(itemId));
			if (!itemDef) {
				console.log("Item not found in itemsList:", itemId);
				return;
			}

			// Verkaufspreis (z. B. 50 % vom Kaufpreis)
			const totalPrice = Math.floor(itemDef.price * quantity);

			// 4️⃣ Items aus Inventar entfernen
			await removeItemFromInventory(player.inventory_id, itemId, quantity);

			// 5️⃣ Geld hinzufügen
			const result = await PlayerAddMoney(player.id, totalPrice);

			if (!result.success) {
				socket.emit("Show:Dialogbox", "Error while adding money.");
				return;
			}

			// 6️⃣ Inventar erneut laden & an Client schicken
			const updatedInventory = await loadInventoryByInventoryId(player.inventory_id);
			socket.emit("inventory:update:items", updatedInventory);

			// 7️⃣ Feedback
			socket.emit("player:money:update", result.newBalance);
			socket.emit("Play:Sound:Coin");
			socket.emit("Show:Dialogbox", `Sold ${quantity}x ${itemDef.name} for ${totalPrice} coins.`);
		});

		// ------------------------------
		// Resources Events
		// ------------------------------

		socket.on("world:resources:load", async () => {
			// 1️⃣ World-Daten aus DB inkl. kompletter Definitionen
			const dbWorldResources = await loadWorldResources();

			// 2️⃣ Server-State neu aufbauen
			worldResources.clear();

			for (const wr of dbWorldResources) {
				worldResources.set(wr.id, {
					id: wr.id,
					resource_id: wr.resource_id,
					x: wr.x,
					y: wr.y,
					key: wr.key,
					name: wr.name,
					description: wr.description,
					level: wr.level,
				});
			}

			socket.emit("world_resources_update", Array.from(worldResources.values()));
		});

		socket.on("world:resources:remove", async (world_resource_id) => {
			//	await RemoveWorldResourceById(world_resource_id);
			socket.emit("world_resource:removed", world_resource_id);
			socket.broadcast.emit("world_resource:removed", world_resource_id);
		});

		//NPCs

		socket.on("inventory:open:request", (npcId) => {
			const npcInventory = npcInventories.get(npcId);
			if (!npcInventory) return;

			socket.emit("inventory:open:true", npcInventory);
		});

		// Chat
		socket.on("chat:message", (msg) => {
			const player = players[socket.id];
			if (!player) return;

			const payload = {
				playerName: player.name,
				message: msg,
			};

			// Sende an alle Spieler
			io.emit("chat:message", payload);
			io.emit("Show:Dialogbox", payload.playerName + " : " + payload.message);
		});

		// Fehler-Handler: sende alle Serverfehler an Spieler Dialogbox
		process.on("uncaughtException", (err) => {
			console.error(err);
			io.emit("Show:Dialogbox", `Server Error: ${err.message}`);
		});
		process.on("unhandledRejection", (reason) => {
			console.error(reason);
			io.emit("Show:Dialogbox", `Server Error: ${reason}`);
		});
	});
}
