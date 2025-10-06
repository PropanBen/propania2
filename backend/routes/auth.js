// auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import { pool } from "../database/db.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "token";
const SERVER_PORT = process.env.SERVER_PORT;

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

// --- LOGIN ---
router.post("/login", async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) return res.status(400).json({ message: "Email und Passwort benötigt" });

	let conn;
	try {
		conn = await pool.getConnection();
		const rows = await conn.query("SELECT id,email,password FROM account WHERE email = ?", [email]);

		if (rows.length === 0) return res.status(401).json({ message: "Ungültige Email oder Passwort" });

		const user = rows[0];
		const passwordMatches = await bcrypt.compare(password, user.password);
		if (!passwordMatches) return res.status(401).json({ message: "Ungültige Email oder Passwort" });

		const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
			expiresIn: "2h",
		});

		res.cookie(COOKIE_NAME, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 2 * 60 * 60 * 1000, // 2 Stunden
		});

		res.json({ message: "Login erfolgreich" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Serverfehler" });
	} finally {
		if (conn) conn.release();
	}
});

// --- GET CURRENT USER ---
router.get("/me", (req, res) => {
	const token = req.cookies[COOKIE_NAME];
	if (!token) return res.status(401).json({ message: "Nicht eingeloggt" });

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		res.json({ id: payload.id, email: payload.email });
	} catch (err) {
		res.status(401).json({ message: "Ungültiger Token" });
	}
});

// --- REGISTER ---
router.post("/register", async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) return res.status(400).json({ message: "Email und Passwort benötigt" });

	let conn;
	try {
		conn = await pool.getConnection();

		const existing = await conn.query("SELECT * FROM account WHERE email = ?", [email]);
		if (existing.length > 0) return res.status(409).json({ message: "Email ist bereits registriert" });

		const hashedPassword = await bcrypt.hash(password, 10);
		const result = await conn.query("INSERT INTO account (email, password) VALUES (?, ?)", [email, hashedPassword]);

		const token = jwt.sign({ id: result.insertId.toString(), email }, JWT_SECRET, {
			expiresIn: "2h",
		});

		res.cookie(COOKIE_NAME, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 2 * 60 * 60 * 1000,
		});

		res.status(201).json({ message: "Registrierung erfolgreich" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Serverfehler" });
	} finally {
		if (conn) conn.release();
	}
});

// --- LOGOUT ---
router.post("/logout", (req, res) => {
	res.clearCookie(COOKIE_NAME);
	res.json({ message: "Logout erfolgreich" });
});

export default router;
