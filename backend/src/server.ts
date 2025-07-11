import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import playersRoutes from './routes/players.js';
import protectedRoutes from './routes/protected.js';
import SocketManager from './SocketManager.js';

const app = express();

// SSL-Zertifikate einbinden
const sslOptions = {
	key: fs.readFileSync('./certs/privkey.pem'),
	cert: fs.readFileSync('./certs/fullchain.pem'),
};

// Port-Konfiguration
const SERVER_PORT = Number(process.env.SERVER_PORT) || 3001;

// Liste der erlaubten Ursprünge
const allowedOrigins = [
	'https://propania2.de',
	'https://www.propania2.de',
	'https://api.propania2.de',
	'http://propania2.de',
	'http://www.propania2.de',
	'http://api.propania2.de',
	'http://localhost:8080',
	'https://localhost:8080',
	'http://192.168.178.89:8080',
];

// CORS-Konfiguration mit dynamischer Origin-Zulassung
interface CorsOptions {
	origin: (
		origin: string | undefined,
		callback: (err: Error | null, allow?: boolean) => void
	) => void;
	methods: string[];
	allowedHeaders: string[];
	credentials: boolean;
}

const corsOptions: CorsOptions = {
	origin(
		origin: string | undefined,
		callback: (err: Error | null, allow?: boolean) => void
	): void {
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
	methods: ['GET', 'POST'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight-Anfragen unterstützen
app.use(express.json());

// API-Routen
app.use('/auth', authRoutes);
app.use('/players', playersRoutes);
app.use('/protected', protectedRoutes);

// HTTPS-Server mit Socket.IO initialisieren
const httpsServer = https.createServer(sslOptions, app);
const httpServer = http.createServer(app);
SocketManager.initialize(httpServer);

// Server starten  auf https oder http umstellen
httpServer.listen(SERVER_PORT, '0.0.0.0', () => {
	console.log(
		`✅ HTTPS-Server läuft unter https://api.propania2.de:${SERVER_PORT}`
	);
});
