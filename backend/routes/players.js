// auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { pool } from '../database/db.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'token';

// --- Middleware ---
router.use(cookieParser());

// CORS für React-Frontend (Port 8080)
router.use(
	cors({
		origin: 'http://localhost:8080',
		credentials: true,
	})
);

// --- GET ALL PLAYERS FOR ACCOUNT ---
router.get('/players', async (req, res) => {
	const token = req.cookies[COOKIE_NAME];
	if (!token) return res.status(401).json({ message: 'Nicht eingeloggt' });

	let conn;
	try {
		const payload = jwt.verify(token, JWT_SECRET); // enthält id (=account_id)
		const accountId = payload.id;

		conn = await pool.getConnection();
		const players = await conn.query(
			'SELECT * FROM players WHERE account_id = ?',
			[accountId]
		);

		res.json(players);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Serverfehler' });
	} finally {
		if (conn) conn.release();
	}
});

export default router;
