/* eslint-disable no-console */
import express, { json } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

const io = new Server(server, {
	cors: {
		origin: 'http://localhost:8080', // Erlaube Frontend auf Port 8080
		methods: ['GET', 'POST'],
		allowedHeaders: ['Content-Type'], // Sicherstellen, dass der Content-Type erlaubt wird
		credentials: true, // Falls du mit Cookies oder Authentifizierung arbeitest
	},
});

const PORT = 3001;

// Middleware für CORS (HTTP-Anfragen)
app.use(
	cors({
		origin: 'http://localhost:8080', // Erlaube Frontend auf Port 8080
		methods: ['GET', 'POST'],
		credentials: true, // Falls Cookies verwendet werden
	})
);

app.use(json()); // JSON-Parser für eingehende Anfragen

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

// Server starten
server.listen(PORT, () => {
	console.log(`Backend läuft auf http://localhost:${PORT}`);
});
