// server/database/db.js
import mariadb from "mariadb";
import dotenv from "dotenv";
import Functions from "../utils/functions.js";
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

// --------- Items & Inventare ----------

// Stammdaten eines Items
export async function loadItemDefById(itemId) {
	const rows = await query("SELECT id, `key`, name, stackable FROM items WHERE id = ?", [itemId]);
	if (!rows[0]) return null;
	const r = rows[0];
	return {
		id: Number(r.id),
		key: r.key,
		name: r.name,
		stackable: Boolean(r.stackable),
	};
}

// Alle Welt-Items laden (optional: nach Map filtern)
export async function loadWorldItems() {
	const rows = await query(
		`SELECT wi.id, wi.item_id, wi.x, wi.y, wi.quantity, i.\`key\`, i.name
     FROM world_items wi
     JOIN items i ON i.id = wi.item_id`
	);
	return rows.map((r) => ({
		id: Number(r.id),
		item_id: Number(r.item_id),
		x: Number(r.x),
		y: Number(r.y),
		quantity: Number(r.quantity),
		key: r.key,
		name: r.name,
	}));
}

export async function createWorldItem(connOrNull, item_id, x, y, quantity = 1) {
	const run = connOrNull ?? { query };
	const res = await (connOrNull
		? connOrNull.query("INSERT INTO world_items (item_id, x, y, quantity) VALUES (?, ?, ?, ?)", [item_id, x, y, quantity])
		: query("INSERT INTO world_items (item_id, x, y, quantity) VALUES (?, ?, ?, ?)", [item_id, x, y, quantity]));
	const id = Number(res.insertId);

	const itemDef = await (connOrNull
		? connOrNull.query("SELECT `key`, name FROM items WHERE id = ?", [item_id])
		: query("SELECT `key`, name FROM items WHERE id = ?", [item_id]));

	return {
		id,
		item_id: Number(item_id),
		x: Number(x),
		y: Number(y),
		quantity: Number(quantity),
		key: itemDef[0]?.key ?? "unknown",
		name: itemDef[0]?.name ?? `Item ${item_id}`,
	};
}

export async function deleteWorldItem(conn, world_item_id) {
	await conn.query("DELETE FROM world_items WHERE id = ?", [world_item_id]);
}

// Inventar holen/erzeugen
export async function getOrCreateInventory(conn, ownerType, ownerId) {
	const rows = await conn.query("SELECT id FROM inventories WHERE owner_type = ? AND owner_id = ?", [ownerType, ownerId]);
	if (rows.length > 0) return Number(rows[0].id);

	const res = await conn.query("INSERT INTO inventories (owner_type, owner_id) VALUES (?, ?)", [ownerType, ownerId]);
	return Number(res.insertId);
}

// Aktuellen Inventarinhalt aggregiert laden
export async function loadInventory(ownerType, ownerId) {
	const rows = await query(
		`SELECT ii.item_id, SUM(ii.quantity) AS quantity, i.\`key\`, i.name
     FROM inventory_items ii
     JOIN inventories inv ON inv.id = ii.inventory_id
     JOIN items i ON i.id = ii.item_id
     WHERE inv.owner_type = ? AND inv.owner_id = ?
     GROUP BY ii.item_id, i.\`key\`, i.name
     ORDER BY i.name ASC`,
		[ownerType, ownerId]
	);
	return {
		capacity: 20, // feste Kapazität; später evtl. aus DB
		items: rows.map((r) => ({
			item_id: Number(r.item_id),
			quantity: Number(r.quantity),
			key: r.key,
			name: r.name,
		})),
	};
}

// Menge eines Items ins Inventar addieren (stackend)
export async function addItemToInventory(conn, inventoryId, itemId, quantity) {
	await conn.query(
		`INSERT INTO inventory_items (inventory_id, item_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
		[inventoryId, itemId, quantity]
	);
}

// Menge aus Inventar entfernen (wirft bei Mangel)
export async function removeItemFromInventory(conn, inventoryId, itemId, quantity) {
	const rows = await conn.query("SELECT id, quantity FROM inventory_items WHERE inventory_id = ? AND item_id = ?", [inventoryId, itemId]);
	if (rows.length === 0 || Number(rows[0].quantity) < quantity) {
		throw new Error("Not enough quantity in inventory");
	}
	const newQty = Number(rows[0].quantity) - quantity;
	if (newQty === 0) {
		await conn.query("DELETE FROM inventory_items WHERE id = ?", [Number(rows[0].id)]);
	} else {
		await conn.query("UPDATE inventory_items SET quantity = ? WHERE id = ?", [newQty, Number(rows[0].id)]);
	}
}

// Atomarer Move: Welt-Item -> Inventar
export async function moveWorldItemToInventory(world_item_id, ownerType, ownerId) {
	return withTransaction(async (conn) => {
		const wiRows = await conn.query("SELECT id, item_id, quantity FROM world_items WHERE id = ? FOR UPDATE", [world_item_id]);
		if (wiRows.length === 0) throw new Error("World item not found");

		const item_id = Number(wiRows[0].item_id);
		const quantity = Number(wiRows[0].quantity);

		const invId = await getOrCreateInventory(conn, ownerType, ownerId);

		await deleteWorldItem(conn, world_item_id);
		await addItemToInventory(conn, invId, item_id, quantity);

		return { item_id, quantity };
	});
}

// Atomarer Move: Inventar -> Welt
export async function moveInventoryItemToWorld(ownerType, ownerId, itemId, quantity, x, y) {
	return withTransaction(async (conn) => {
		const invId = await getOrCreateInventory(conn, ownerType, ownerId);
		await removeItemFromInventory(conn, invId, itemId, quantity);
		const created = await createWorldItem(conn, itemId, x, y, quantity);
		return created; // { id, item_id, x, y, quantity, key, name }
	});
}

// Resources
export async function loadResourcesDefinitions() {
	const rows = await query("SELECT id, `key`, name,description,level FROM resources ;");
	return rows.map((r) => ({
		id: Number(r.id),
		key: r.key,
		name: r.name,
		description: r.description,
		level: Number(r.level),
	}));
}

//Items

export async function LoadItemIDbyKey(itemkey) {
	const rows = await query("SELECT id FROM items WHERE `key` = ?;", [itemkey]);
	if (rows.length > 0) {
		return Number(rows[0].id);
	}
}

export async function addWorldItembyKey(itemkey, amount, x, y, quantity = 1) {
	for (let i = 0; i < amount; i++) {
		const item_id = await LoadItemIDbyKey(itemkey);
		await createWorldItem(null, item_id, x + Functions.randomFloatRange(-50, +50), y + Functions.randomFloatRange(-50, +50), quantity);
	}
}

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
	return rows.map((r) => ({
		id: Number(r.id),
		resource_id: Number(r.resource_id),
		x: Number(r.x),
		y: Number(r.y),
	}));
}
