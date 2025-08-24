import mariadb from 'mariadb';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	connectionLimit: 5,
});

// Hilfsfunktion für Queries
export async function query(sql, params = []) {
	let conn;
	try {
		conn = await pool.getConnection();
		const res = await conn.query(sql, params);
		return res;
	} catch (err) {
		console.error('DB Fehler:', err);
		throw err;
	} finally {
		if (conn) conn.release();
	}
}

export async function loadPlayerFromDB(playerId) {
	try {
		const rows = await query(
			'SELECT id, name, money, exp, level, positionX, positionY FROM players WHERE id = ?',
			[playerId]
		);

		if (rows.length > 0) {
			const row = rows[0];
			return {
				id: row.id,
				name: row.name,
				money: row.money,
				exp: row.exp,
				level: row.level,
				positionX: row.positionX,
				positionY: row.positionY,
			};
		}
		return null;
	} catch (err) {
		console.error('DB Fehler:', err);
		throw err;
	}
}

export async function updatePlayer(playerData) {
	if (!playerData || Object.keys(playerData).length === 0) {
		return;
	}

	if (playerData.id === undefined) {
		return;
	}

	const { money, exp, level, x, y, id } = playerData;

	await query(
		'UPDATE players SET money = COALESCE(?, money), exp = COALESCE(?, exp), level = COALESCE(?, level), positionX = COALESCE(?, positionX), positionY = COALESCE(?, positionY) WHERE id = ?',
		[money, exp, level, x, y, id]
	);
}
