const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Erstelle die Express-App und den HTTP-Server
const app = express();
const server = http.createServer(app);

// CORS-Optionen für Socket.IO konfigurieren
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001", // URL des Clients (z.B. Phaser.js)
    methods: ["GET", "POST"]
  }
});

// CORS für Express-Routen aktivieren (optional, falls du REST-API hast)
app.use(cors());

// Statische Dateien bereitstellen
app.use(express.static('public'));

// Wenn ein Spieler sich verbindet, gebe eine Nachricht aus
io.on('connection', (socket) => {
  console.log('A new player connected:', socket.id);

  // Sende eine Nachricht an den Client
  socket.emit('message', 'Player with id :' + socket.id + ' connected');

  // Reagiere auf benutzerdefinierte Ereignisse vom Client
  socket.on('playerConnected', (data) => {
    console.log(data.player + ' hat sich verbunden!');
    // Sende eine Nachricht zurück an den Client
    socket.emit('playerConnected', { player: data.player });
  });

  // Überwache die Trennung des Spielers
  socket.on('disconnect', () => {
    console.log('Ein Spieler hat das Spiel verlassen:', socket.id);
  });
});

// Server starten und auf Port 3001 hören
server.listen(3001, () => {
  console.log('Server läuft auf http://localhost:3001');
});
