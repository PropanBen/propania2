// server/database/db.js
import mariadb from "mariadb";
import dotenv from "dotenv";
import Functions from "../utils/functions.js";
import itemsList from "../entities/itemlist.js";
import resourcesList from "../entities/resourceslist.js";
dotenv.config();

export const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	connectionLimit: 5,
});

// --------- Hilfsfunktionen ----------
export async function query(sql, params = []) {
	let conn;
	try {
		conn = await pool.getConnection();
		const res = await conn.query(sql, params);
		return res;
	} catch (err) {
		console.error("DB Fehler:", err);
		throw err;
	} finally {
		if (conn) conn.release();
	}
}

export async function withTransaction(fn) {
	let conn;
	try {
		conn = await pool.getConnection();
		await conn.beginTransaction();
		const result = await fn(conn);
		await conn.commit();
		return result;
	} catch (err) {
		if (conn) {
			try {
				await conn.rollback();
			} catch (_) {}
		}
		console.error("DB TX Fehler:", err);
		throw err;
	} finally {
		if (conn) conn.release();
	}
}

// --------- Spieler-Loading/Persistenz ----------
export async function loadPlayerFromDB(playerId) {
	try {
		const rows = await query("SELECT id, name, money, exp, level, currenthealth, positionX, positionY FROM players WHERE id = ?", [
			playerId,
		]);

		if (rows.length > 0) {
			const row = rows[0];
			return {
				id: Number(row.id),
				name: row.name,
				money: Number(row.money),
				exp: Number(row.exp),
				level: Number(row.level),
				currenthealth: Number(row.currenthealth),
				positionX: Number(row.positionX),
				positionY: Number(row.positionY),
			};
		}
		return null;
	} catch (err) {
		console.error("DB Fehler:", err);
		throw err;
	}
}

export async function updatePlayer(playerData) {
	if (!playerData || Object.keys(playerData).length === 0) return;
	if (playerData.id === undefined) return;

	const { money, exp, level, currenthealth, x, y, id } = playerData;

	await query(
		"UPDATE players SET money = COALESCE(?, money), exp = COALESCE(?, exp), level = COALESCE(?, level), currenthealth = COALESCE(?, currenthealth), positionX = COALESCE(?, positionX), positionY = COALESCE(?, positionY) WHERE id = ?",
		[money, exp, level, currenthealth, x, y, id]
	);
}

export async function PlayerRemoveMoney(playerId, amount) {
	if (!playerId || typeof amount !== "number" || amount <= 0) {
		throw new Error("Ungültige Parameter");
	}

	const rows = await query("SELECT money FROM players WHERE id = ?", [playerId]);
	if (rows.length === 0) throw new Error("Spieler nicht gefunden");

	const currentMoney = Number(rows[0].money);

	if (currentMoney < amount) {
		return { success: false, newBalance: currentMoney };
	}

	const newMoney = currentMoney - amount;
	await query("UPDATE players SET money = ? WHERE id = ?", [newMoney, playerId]);

	return { success: true, newBalance: newMoney };
}

export async function PlayerAddMoney(playerId, amount) {
	if (!playerId || typeof amount !== "number" || amount <= 0) {
		throw new Error("Ungültige Parameter für addPlayerMoney");
	}

	// Spieler aus DB laden
	const rows = await query("SELECT money FROM players WHERE id = ?", [playerId]);

	if (rows.length === 0) {
		throw new Error("Spieler nicht gefunden");
	}

	const currentMoney = Number(rows[0].money);
	const newMoney = currentMoney + amount;

	// Geld hinzufügen
	await query("UPDATE players SET money = ? WHERE id = ?", [newMoney, playerId]);

	return { success: true, newBalance: newMoney };
}

// --------- Items & Inventare ----------

// Load World Items
export async function loadWorldItems() {
	const rows = await query(
		`SELECT wi.id, wi.item_id, wi.x, wi.y, wi.quantity
		 FROM world_items wi`
	);

	// Lookup-Tabelle für schnelle Zuordnung
	const itemsById = new Map(itemsList.map((item) => [Number(item.item_id), item]));

	return rows.map((r) => {
		const itemDef = itemsById.get(Number(r.item_id));

		return {
			id: Number(r.id),
			item_id: Number(r.item_id),
			key: itemDef?.key ?? null,
			name: itemDef?.name ?? null,
			x: Number(r.x),
			y: Number(r.y),
			quantity: Number(r.quantity),
		};
	});
}

// Create World Item
export async function WorldItemExits(world_item_id, quantity) {
	const rows = await query("SELECT id, quantity FROM world_items WHERE id = ? AND quantity >= ?", [world_item_id, quantity]);
	return rows.length > 0;
}

export async function createWorldItem(item_id, x, y, quantity = 1) {
	// 1️⃣ Insert in die DB
	const res = await query("INSERT INTO world_items (item_id, x, y, quantity) VALUES (?, ?, ?, ?)", [item_id, x, y, quantity]);
	const id = Number(res.insertId);

	// 2️⃣ Lookup in itemsList
	const itemDef = itemsList.find((item) => Number(item.item_id) === Number(item_id));

	return {
		id,
		item_id: Number(item_id),
		x: Number(x),
		y: Number(y),
		quantity: Number(quantity),
		key: itemDef?.key ?? "unknown",
		name: itemDef?.name ?? `Item ${item_id}`,
	};
}

// Remove World Item or reduce quantity
export async function removeWorldItem(world_item_id, quantity) {
	const world_item = await query("Select id, quantity FROM world_items WHERE id = ? FOR UPDATE", [world_item_id]);
	if (world_item.length === 0) throw new Error("World item not found");
	const currentQty = Number(world_item[0].quantity);

	if (currentQty > quantity) {
		const newQty = currentQty - quantity;
		await query("UPDATE world_items SET quantity = ? WHERE id = ?", [newQty, world_item_id]);
	} else {
		deleteWorldItem(world_item_id);
	}
}

// Delete World Item
export async function deleteWorldItem(world_item_id) {
	await query("DELETE FROM world_items WHERE id = ?", [world_item_id]);
}

// Inventory system

export async function getOrCreateInventory(conn, ownerType, ownerId) {
	const rows = await conn.query("SELECT id FROM inventories WHERE owner_type = ? AND owner_id = ?", [ownerType, ownerId]);

	if (rows.length > 0) {
		return Number(rows[0].id);
	}

	const res = await conn.query("INSERT INTO inventories (owner_type, owner_id, capacity) VALUES (?, ?, ?)", [ownerType, ownerId, 10]);

	return Number(res.insertId);
}

/*
export async function loadInventory(ownerId) {
	// 1️⃣ DB-Abfrage nur nach item_id und quantity
	const rows = await query(
		`SELECT ii.item_id, SUM(ii.quantity) AS quantity
         FROM inventory_items ii
         JOIN inventories inv ON inv.id = ii.inventory_id
         WHERE inv.owner_id = ?
         GROUP BY ii.item_id
         ORDER BY ii.item_id ASC`,
		[ownerId]
	);
	*/

export async function loadInventoryByInventoryId(inventory_id) {
	const rows = await query(
		`SELECT ii.item_id, SUM(ii.quantity) AS quantity
		 FROM inventory_items ii
		 WHERE ii.inventory_id = ?
		 GROUP BY ii.item_id
		 ORDER BY ii.item_id ASC`,
		[inventory_id]
	);

	const itemsById = new Map(itemsList.map((item) => [Number(item.item_id), item]));

	const items = rows.map((r) => {
		const def = itemsById.get(Number(r.item_id));
		return {
			item_id: Number(r.item_id),
			quantity: Number(r.quantity),
			key: def?.key ?? null,
			name: def?.name ?? null,
		};
	});

	return {
		inventory_id,
		capacity: 20,
		items,
	};
}

export async function ItemExistsInInventory(inventory_id, item_id, quantity) {
	const rows = await query("SELECT id, quantity FROM inventory_items WHERE inventory_id = ? AND item_id = ? AND quantity >= ?", [
		inventory_id,
		item_id,
		quantity,
	]);
	return rows.length > 0;
}

export async function addItemToInventory(inventory_id, item_id, quantity) {
	await query(
		`INSERT INTO inventory_items (inventory_id, item_id, quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
		[inventory_id, item_id, quantity]
	);
}

export async function removeItemFromInventory(inventoryId, item_id, quantity) {
	const rows = await query("SELECT id, quantity FROM inventory_items WHERE inventory_id = ? AND item_id = ?", [inventoryId, item_id]);

	if (rows.length === 0 || Number(rows[0].quantity) < quantity) {
		return;
	}

	const newQty = Number(rows[0].quantity) - quantity;

	if (newQty === 0) {
		await query("DELETE FROM inventory_items WHERE id = ?", [Number(rows[0].id)]);
	} else {
		await query("UPDATE inventory_items SET quantity = ? WHERE id = ?", [newQty, Number(rows[0].id)]);
	}
}

// Resources

export async function RemoveWorldResourceById(world_resource_id) {
	try {
		await query("DELETE FROM world_resources WHERE id = ?", [world_resource_id]);
		return true;
	} catch (err) {
		console.error("DB Fehler:", err);
		throw err;
	}
}

export async function loadWorldResources() {
	const rows = await query(`SELECT id, resource_id, x, y FROM world_resources`);

	// Lookup-Tabelle für schnelle Zuordnung
	const resourcesById = new Map(resourcesList.map((res) => [Number(res.id), res]));

	return rows.map((r) => {
		const resDef = resourcesById.get(Number(r.resource_id));

		return {
			id: Number(r.id),
			resource_id: Number(r.resource_id),
			key: resDef?.key ?? null,
			name: resDef?.name ?? null,
			description: resDef?.description ?? null,
			level: resDef?.level ?? null,
			x: Number(r.x),
			y: Number(r.y),
		};
	});
}
