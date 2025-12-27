import { query } from "./db.js";

export async function loadPlayerProfessions(playerId) {
	const rows = await query("SELECT profession_id, level, exp FROM player_professions WHERE player_id = ?", [playerId]);
	return rows; // direkt zurückgeben
}

export async function unlockProfession(playerId, professionId) {
	// 1️⃣ Prüfen, ob der Spieler den Beruf bereits hat
	const existing = await query("SELECT * FROM player_professions WHERE player_id = ? AND profession_id = ?", [playerId, professionId]);

	if (existing.length > 0) {
		// Spieler hat den Beruf schon
		return { success: false, message: "Profession already unlocked." };
	}

	// 2️⃣ Beruf freischalten
	await query("INSERT INTO player_professions (player_id, profession_id) VALUES (?, ?)", [playerId, professionId]);

	return { success: true, message: "Profession unlocked successfully." };
}

export async function addProfessionExp(playerId, professionId, exp) {
	await query("UPDATE player_professions SET exp = exp + ? WHERE player_id = ? AND profession_id = ?", [exp, playerId, professionId]);
}
