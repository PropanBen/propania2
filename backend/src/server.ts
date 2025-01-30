import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import authRoutes from './routes/auth.js';
import protectedRoutes from './routes/protected.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: 'http://localhost:8080', // Deine Frontend-URL
		methods: ['GET', 'POST'],
		credentials: true, // Wenn du Cookies oder Sitzungsdaten verwenden willst
	},
});

const PORT = process.env.PORT || 3001;

// CORS-Konfiguration für REST API
const corsOptions = {
	origin: 'http://localhost:8080', // Frontend-URL
	methods: ['GET', 'POST'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true, // Damit Cookies gesendet werden können
};

app.use(cors(corsOptions));
app.use(express.json());

// Routen
app.use('/auth', authRoutes); // Authentifizierungs Routen
app.use('/protected', protectedRoutes); // Geschützte Routen

// Socket.IO Verbindungslogik
io.on('connection', (socket) => {
	console.log('Ein Benutzer ist verbunden');
	socket.on('disconnect', () => {
		console.log('Ein Benutzer hat die Verbindung getrennt');
	});
});

// Server starten
server.listen(PORT, () => {
	console.log(`Server läuft auf http://localhost:${PORT}`);
});
