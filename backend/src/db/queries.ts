import { query } from './index.js';

export async function findAll<T>(tableName: string): Promise<T[]> {
	return query<T[]>(`SELECT * FROM ??`, [tableName]);
}

export async function findById<T>(tableName: string, id: number): Promise<T> {
	return query<T>(`SELECT * FROM ?? WHERE id = ?`, [tableName, id]);
}

export async function insert<T>(tableName: string, data: object): Promise<T> {
	const keys = Object.keys(data).join(', ');
	const placeholders = Object.keys(data)
		.map(() => '?')
		.join(', ');
	const values: unknown[] = Object.values(data);

	return query<T>(`INSERT INTO ?? (${keys}) VALUES (${placeholders})`, [
		tableName,
		...values,
	]);
}
