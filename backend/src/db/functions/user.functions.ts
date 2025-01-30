import { query } from '../index.js';
import type { DbUser } from '../models/users.model';
import bcrypt from 'bcrypt';

export async function insertUser(name: string, email: string, pass: string) {
	const hashedPassword = await bcrypt.hash(pass, 10);
	const creationDate: Date = new Date();

	const user: DbUser = {
		name,
		email,
		pass: hashedPassword,
		createdAt: creationDate,
		updatedAt: creationDate,
	};

	const createdUser = await query<DbUser>(
		'INSERT INTO users (name, email, pass, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
		[user.name, user.email, user.pass, user.createdAt, user.updatedAt]
	);

	delete createdUser.pass;

	return createdUser;
}
