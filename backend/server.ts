import type { Application, Request, Response, NextFunction } from 'express';
import express, { json } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mariadb from 'mariadb';
import dotenv from 'dotenv';

const app: Application = express();
const server = createServer(app);

const io = new Server(server, {
	cors: {
		origin: 'http://localhost:8080', // Erlaube Frontend auf Port 8080
		methods: ['GET', 'POST'],
		allowedHeaders: ['Content-Type', 'Authorization'], // Sicherstellen, dass der Content-Type erlaubt wird
		credentials: true, // Falls du mit Cookies oder Authentifizierung arbeitest
	},
});

// Middleware für CORS (HTTP-Anfragen)
app.use(
	cors({
		origin: 'http://localhost:8080', // Erlaube Frontend auf Port 8080
		methods: ['GET', 'POST'],
		credentials: true, // Falls Cookies verwendet werden
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
);
dotenv.config();
app.use(express.json());

const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET;

const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '5', 10),
});

// Benutzerkonto erstellen
app.post('/register', async (req, res) => {
	const { email, password } = req.body as { email: string; password: string };

	// Überprüfen, ob alle Felder ausgefüllt sind
	if (!email || !password) {
		res.status(400).json({ message: 'Please fill all fields' });
		return; // Wichtig: return hinzufügen, um die Ausführung zu stoppen
	}

	try {
		const conn = await pool.getConnection();

		try {
			// Überprüfen, ob die E-Mail bereits existiert
			const checkEmailQuery = `SELECT * FROM account WHERE email = ?`;
			const existingUsers = await conn.query(checkEmailQuery, [email]);

			if (existingUsers.length > 0) {
				// E-Mail existiert bereits
				res.status(400).json({ message: 'E-Mail already in use' });
				return; // Wichtig: return hinzufügen, um die Ausführung zu stoppen
			}

			// E-Mail existiert nicht, Benutzer erstellen
			const hashedPassword = (await bcrypt.hash(password, 10)) as string; // Passwort hashen
			const createUserQuery = `INSERT INTO account (email, password, created_at) VALUES (?, ?, NOW())`;
			await conn.query(createUserQuery, [email, hashedPassword]);

			res.status(201).json({ message: 'Successfully registered' });
		} finally {
			conn.release(); // Verbindung immer freigeben
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Failed to create an account' });
	}
});

// Benutzer-Login
app.post('/login', async (req: Request, res: Response): Promise<void> => {
	const { email, password } = req.body as { email: string; password: string };

	if (!email || !password) {
		res.status(400).json({ message: 'Bitte alle Felder ausfüllen!' });
		return;
	}

	try {
		const conn = await pool.getConnection();
		try {
			const query = `SELECT * FROM account WHERE email = ?`;
			const rows: { id: number; email: string; password: string }[] =
				(await conn.query(query, [email])) as [];

			if (rows.length === 0) {
				res.status(401).json({ message: 'Ungültige Anmeldedaten!' });
				return;
			}

			const user = rows[0];
			const isPasswordValid = (await bcrypt.compare(
				password,
				user.password
			)) as boolean;

			if (!isPasswordValid) {
				res.status(401).json({ message: 'Ungültige Anmeldedaten!' });
				return;
			}

			const token = jwt.sign(
				{ userId: user.id, email: user.email },
				JWT_SECRET!,
				{
					expiresIn: '1h',
				}
			) as string;

			res.status(200).json({ message: 'Login erfolgreich!', token });
			return;
		} finally {
			conn.release();
		}
	} catch (error) {
		console.error('Error during login:', error);
		res.status(500).json({ message: 'Fehler beim Login' });
		return;
	}
});

app.post(
	'/validateToken',
	authenticateToken,
	(req: AuthenticatedRequest, res: Response) => {
		// Wenn die Middleware `authenticateToken` erfolgreich ist, ist der Token gültig
		res.status(200).json({ message: 'Token is valid', user: req.user });
	}
);

// Middleware zur Authentifizierung mit JWT
interface AuthenticatedRequest extends Request {
	user?: { userId: number; email: string };
}

function authenticateToken(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): void {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		res.status(401).json({ message: 'Zugriff verweigert!' });
		return; // Wichtig: return hinzufügen, um die Ausführung zu stoppen
	}

	if (typeof token === 'string') {
		jwt.verify(token, JWT_SECRET!, (err, user) => {
			if (err) {
				return res.status(403).json({ message: 'Ungültiger Token!' });
			}

			req.user = user as { userId: number; email: string };
			next();
		});
	} else {
		res.status(401).json({ message: 'Zugriff verweigert!' });
	}
}

/*
// Beispiel geschützter Route
app.get(
	'/protected',
	authenticateToken,
	(req: AuthenticatedRequest, res: Response) => {
		res.status(200).json({ message: 'Geschützter Inhalt', user: req.user });
	}
);

// Socket.IO-Verbindungen
io.on('connection', (socket) => {
	console.log(`Benutzer verbunden: ${socket.id}`);

	// Event-Listener für Nachrichten
	socket.on('message', (data) => {
		console.log(`Nachricht erhalten: ${data}`);
		io.emit('message', `Server hat empfangen: ${data}`);
	});

	// Event-Listener für Trennung
	socket.on('disconnect', () => {
		console.log(`Benutzer getrennt: ${socket.id}`);
	});
});
*/
// Server starten
server.listen(PORT, () => {
	console.log(`Backend läuft auf http://localhost:${PORT}`);
});
