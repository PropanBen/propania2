// server/game/gameserver.js
import {
	loadPlayerFromDB,
	updatePlayer,
	loadWorldItems,
	moveWorldItemToInventory,
	moveInventoryItemToWorld,
	loadInventory,
	loadResourcesDefinitions,
	loadWorldResources,
} from "../database/db.js";

export function initGameServer(io) {
	const players = new Map();
	const worldItems = new Map();
	let worldResources = {};

	async function ensureWorldItemsLoaded() {
		if (worldItems.size > 0) return;
		const items = await loadWorldItems();
		items.forEach((it) => worldItems.set(it.id, it));
	}

	io.on("connect_error", (err) => {
		console.error("Socket.IO connect_error:", err);
	});

	io.on("connection", (socket) => {
		console.log(`Player connected: ${socket.id}`);

		// Platzhalter Spieler (bis DB geladen)
		players.set(socket.id, {
			id: socket.id, // vorläufig
			socket_id: socket.id,
			name: "Loading...",
			x: 100,
			y: 100,
			anim: "idle_down",
		});

		/**
		 * Spieler initialisiert Welt (lädt Daten aus DB)
		 */
		socket.on("world:init:request", async (data) => {
			try {
				const player_id = data?.player_id;
				if (!player_id) {
					console.warn("world:init:request ohne player_id von", socket.id);
					return;
				}

				const playerFromDB = await loadPlayerFromDB(player_id);

				if (playerFromDB) {
					const player = {
						...playerFromDB,
						id: player_id,
						socket_id: socket.id,
						x: playerFromDB.positionX ?? 100,
						y: playerFromDB.positionY ?? 100,
						anim: "idle_down",
					};

					players.set(socket.id, player);

					// Dem neuen Spieler alle aktuellen schicken
					socket.emit("currentPlayers", Object.fromEntries(players));

					// Welt-Items einmalig laden und dem neuen Spieler senden
					await ensureWorldItemsLoaded();
					socket.emit("world:items:init", Array.from(worldItems.values()));

					// Inventar des Spielers senden
					const inv = await loadInventory("player", player_id);
					socket.emit("inventory:update", inv);

					const resourcesDefinitions = await loadResourcesDefinitions();
					worldResources = await loadWorldResources();

					const resources = { resourcesDefinitions, worldResources };
					socket.emit("world:resources:init", resources);

					// Allen anderen mitteilen, dass neuer Spieler da ist
					socket.broadcast.emit("newPlayer", player);
				} else {
					console.log(`Kein Spieler in DB für player_id=${player_id}`);
					socket.emit("world:init:error", {
						message: "Player not found in DB",
					});
				}
			} catch (err) {
				console.error("Fehler beim Laden des Spielers:", err);
				socket.emit("world:init:error", { message: "Failed to load player" });
			}
		});

		/**
		 * Bewegung
		 */
		socket.on("playerMovement", (data) => {
			const player = players.get(socket.id);
			if (!player) return;
			player.x = data.x;
			player.y = data.y;
			player.anim = data.anim;
			io.emit("updatePlayers", { socket_id: data.socket_id, x: data.x, y: data.y, anim: data.anim });
		});

		/**
		 * Item-Pickup: Welt -> Inventar
		 */
		socket.on("item:pickup:request", async ({ world_item_id, actionzone }) => {
			try {
				const player = players.get(socket.id);
				if (!player) return;

				const wi = worldItems.get(world_item_id);
				if (!wi) {
					socket.emit("item:error", { message: "Item already picked up" });
					return;
				}

				// Distanz-Check (Server-seitig)
				const dx = (actionzone.x ?? 0) - wi.x;
				const dy = (actionzone.y ?? 0) - wi.y;
				const dist2 = dx * dx + dy * dy;
				const pickupRange = 64;
				if (dist2 > pickupRange * pickupRange) {
					socket.emit("item:error", { message: "Too far away" });
					return;
				}

				// Transaktion: world_items -> inventory_items
				await moveWorldItemToInventory(world_item_id, "player", player.id);

				// In-Memory entfernen + allen mitteilen
				worldItems.delete(world_item_id);
				io.emit("item:removed", world_item_id);

				// Inventar des Spielers aktualisieren
				const inv = await loadInventory("player", player.id);
				socket.emit("inventory:update", inv);
			} catch (err) {
				console.error("item:pickup:request error", err);
				socket.emit("item:error", { message: err.message ?? "Pickup failed" });
			}
		});

		/**
		 * Item-Drop: Inventar -> Welt
		 */
		socket.on("item:drop:request", async ({ item_id, quantity, dropPosition }) => {
			try {
				const player = players.get(socket.id);
				if (!player) return;

				const qty = Math.max(1, Number(quantity) || 1);
				const px = Math.round(dropPosition["x"] ?? player.x ?? 0);
				const py = Math.round(dropPosition["y"] ?? player.y ?? 0);

				// Transaktion: inventory_items -> world_items
				const created = await moveInventoryItemToWorld("player", player.id, item_id, qty, px, py);

				// In-Memory hinzufügen + allen mitteilen
				worldItems.set(created.id, created);
				io.emit("item:spawned", created);

				// Inventar des Spielers aktualisieren
				const inv = await loadInventory("player", player.id);
				socket.emit("inventory:update", inv);
			} catch (err) {
				console.error("item:drop:request error", err);
				socket.emit("item:error", { message: err.message ?? "Drop failed" });
			}
		});

		socket.on("world:resources:remove", async ({ world_resource_id }) => {
			delete worldResources[world_resource_id];
			io.emit("world:resources:update", world_resource_id);
		});

		/**
		 * Disconnect
		 */
		socket.on("disconnect", (reason) => {
			const p = players.get(socket.id);
			if (p) updatePlayer(p).catch((e) => console.error("updatePlayer error", e));
			console.log(`Player disconnected: ${socket.id}`, reason);
			players.delete(socket.id);
			io.emit("playerDisconnected", socket.id);
		});
	});
}
