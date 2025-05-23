import { query } from '../index.js';
import type { Player } from '../models/player.models.js';

export async function insertPlayer(playername: string, accountId: number) {
	const createdPlayer = await query<Player>(
		'INSERT INTO players (name,account_id,money,exp,level,positionX,positionY) VALUES (?,?,?,?,?,?,?)',
		[playername, accountId, 0, 0, 1, 0, 0]
	);

	return createdPlayer;
}

export async function updatePlayer(playerData: Partial<Player>) {
	if (!playerData || Object.keys(playerData).length === 0) {
		return;
	}

	if (playerData.id === undefined) {
		return;
	}
	const { money, exp, level, positionX, positionY, id } = playerData;

	await query(
		'UPDATE players SET money = COALESCE(?, money), exp = COALESCE(?, exp), level = COALESCE(?, level), positionX = COALESCE(?, positionX), positionY = COALESCE(?, positionY) WHERE id = ?',
		[money, exp, level, positionX, positionY, id]
	);
}
