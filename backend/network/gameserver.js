// server/game/gameserver.js

import {
	loadPlayerFromDB,
	updatePlayer,
	loadWorldItems,
	WorldItemExits,
	removeWorldItem,
	loadInventory,
	addItemToInventory,
	removeItemFromInventory,
	createWorldItem,
	ItemExistsInInventory,
	loadWorldResources,
	RemoveWorldResourceById,
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
			playerData.inventory_id = playerInfo.inventory_id;
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
		socket.on("inventory:load", async () => {
			const player = players[socket.id];
			if (!player) return;

			loadInventory(player.id).then((items) => {
				socket.emit("inventory:update:items", items);
			});
		});

		// Server: inventory:item:pickup
		socket.on("inventory:item:pickup", async (inventory_id, item, quantity) => {
			const player = players[socket.id];
			if (!player) return;

			const exists = await WorldItemExits(item.world_item_id, quantity);
			if (!exists) return;

			// Item ins Inventory packen
			await addItemToInventory(inventory_id, item.item_id, quantity);
			await removeWorldItem(item.world_item_id, quantity);
			// Inventory neu laden und zum Client schicken
			const newInventory = await loadInventory(player.id);
			socket.emit("inventory:update:items", newInventory);

			worldItems.delete(item.world_item_id);
			socket.emit("world:item:removed", item.world_item_id);
			socket.broadcast.emit("world:item:removed", item.world_item_id);
		});

		socket.on("inventory:item:drop", async (inventory_id, item, quantity) => {
			const player = players[socket.id];

			if (ItemExistsInInventory(inventory_id, item.item_id, quantity)) {
				if (removeItemFromInventory(inventory_id, item.item_id, quantity)) {
					const dropPostion = Functions.getDropPosition(player.x, player.y, player.lastDirection);
					const newworlditem = await createWorldItem(item.item_id, dropPostion.x, dropPostion.y, quantity);

					worldItems.set(newworlditem.id, newworlditem);
					socket.emit("world:item:add", newworlditem);
					socket.broadcast.emit("world:item:add", newworlditem);
					socket.emit("inventory:item:remove", item, quantity);
				}
			}
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
