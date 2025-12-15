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
} from "../database/db.js";
import Functions from "../utils/functions.js";
import resourcesDrops from "../entities/resourcedrops.js";

export function initGameServer(io) {
	const players = {};
	const worldItems = new Map();
	const worldResources = new Map();

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
	});
}
