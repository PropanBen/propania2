// auth.js
import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import { pool } from "../database/db.js";
import dotenv from "dotenv";
import { getOrCreateInventory } from "../database/db.js";

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "token";

// --- Middleware ---
router.use(cookieParser());

// CORS für React-Frontend (Port 8080)
router.use(
	cors({
		origin: (origin, callback) => {
			const allowedOrigins = ["http://localhost:8080", "https://propania2.de"];
			// Wenn kein Origin (z.B. Postman) oder Origin erlaubt ist
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Nicht erlaubter Origin"));
			}
		},
		credentials: true,
	})
);

// --- GET ALL PLAYERS FOR ACCOUNT ---
router.get("/players", async (req, res) => {
	const token = req.cookies[COOKIE_NAME];
	if (!token) return res.status(401).json({ message: "Nicht eingeloggt" });

	let conn;
	try {
		const payload = jwt.verify(token, JWT_SECRET); // enthält id (=account_id)
		const accountId = payload.id;

		conn = await pool.getConnection();

		// Alle Spieler des Accounts holen
		const players = await conn.query("SELECT * FROM players WHERE account_id = ?", [accountId]);

		// Für jeden Spieler ein Inventar holen oder erstellen
		for (const player of players) {
			const inventoryId = await getOrCreateInventory(
				conn,
				"player",
				player.id // ownerId → ID des Players
			);
			player.inventory_id = inventoryId;
		}

		res.json(players);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Serverfehler" });
	} finally {
		if (conn) conn.release();
	}
});

router.post("/players/register", async (req, res) => {
	const token = req.cookies.token;
	if (!token) return res.status(401).send("Nicht eingeloggt");

	const { name } = req.body;
	if (!name || typeof name !== "string" || name.length > 20) return res.status(400).send("Ungültiger Spielername");

	// Nur Buchstaben und Leerzeichen erlauben
	if (!/^[A-Za-z\s]{1,20}$/.test(name)) {
		return res.status(400).send("Spielername darf nur Buchstaben und Leerzeichen enthalten, max. 20 Zeichen.");
	}

	let conn;
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		const accountId = payload.id;

		conn = await pool.getConnection();

		// Prüfen, wie viele Spieler der Account bereits hat
		const existingPlayers = await conn.query("SELECT COUNT(*) AS count FROM players WHERE account_id = ?", [accountId]);

		const count = Number(existingPlayers[0].count);
		if (count >= 3) {
			return res.status(400).send("Maximal 3 Spieler pro Account erlaubt");
		}

		// SQL Injection vermeiden, Parameterized Query
		const result = await conn.query(
			"INSERT INTO players (account_id, name, money, exp, level, currenthealth, positionX, positionY) VALUES (?, ?, 0, 0, 1, 100, 0, 0)",
			[accountId, name]
		);

		// BigInt (insertId) in String konvertieren, falls nötig
		const playerId = result.insertId.toString();

		res.status(201).json({ id: playerId, name });
	} catch (err) {
		console.error(err);
		res.status(500).send("Serverfehler");
	} finally {
		if (conn) conn.release();
	}
});

function convertBigIntToString(obj) {
	return JSON.parse(JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value)));
}

export default router;
