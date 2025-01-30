import mariadb from 'mariadb';
import { ENV } from '../config/app.js';

const pool = mariadb.createPool({
	host: ENV.DB_HOST,
	user: ENV.DB_USER,
	password: ENV.DB_PASSWORD,
	database: ENV.DB_DATABASE,
	connectionLimit: ENV.DB_CONNECTION_LIMIT
		? Number(ENV.DB_CONNECTION_LIMIT)
		: 5,
	allowPublicKeyRetrieval: true,
	port: ENV.DB_PORT ? Number(ENV.DB_PORT) : 3306,
});

/**
 * T = erwartetes befülltes Objekt
 */
export async function query<T>(sql: string, params?: unknown[]): Promise<T> {
	let connection;
	try {
		connection = await pool.getConnection();
		return await connection.query<T>(sql, params);
	} catch (err) {
		console.error('Datenbankfehler:', err);
		throw err;
	} finally {
		if (connection) {
			connection.release();
		}
	}
}

export default pool;
