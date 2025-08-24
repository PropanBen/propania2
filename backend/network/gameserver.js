import { loadPlayerFromDB, updatePlayer } from '../database/db.js';

export function initGameServer(io) {
	const players = new Map();

	io.on('connect_error', (err) => {
		console.error('Socket.IO connect_error:', err);
	});

	io.on('connection', (socket) => {
		console.log(`Player connected: ${socket.id}`);

		// Platzhalter Spieler
		players.set(socket.id, {
			id: socket.id,
			name: 'Loading...',
			x: 100,
			y: 100,
			anim: 'idle_down',
		});

		/**
		 * Spieler initialisiert Welt (lädt Daten aus DB)
		 */
		socket.on('world:init:request', async (data) => {
			try {
				const player_id = data?.player_id;
				if (!player_id) {
					console.warn('world:init:request ohne player_id von', socket.id);
					return;
				}

				const playerFromDB = await loadPlayerFromDB(player_id);

				if (playerFromDB) {
					const player = {
						...playerFromDB,
						id: player_id,
						socket_id: socket.id,
						x: playerFromDB.positionX ?? 100, // 👈 falls null/undefined → default 100
						y: playerFromDB.positionY ?? 100,
						anim: 'idle_down',
					};

					players.set(socket.id, player);

					// Dem neuen Spieler alle aktuellen schicken
					socket.emit('currentPlayers', Object.fromEntries(players));

					// Allen anderen mitteilen, dass neuer Spieler da ist
					socket.broadcast.emit('newPlayer', player);
				} else {
					console.log(`Kein Spieler in DB für player_id=${player_id}`);
					socket.emit('world:init:error', {
						message: 'Player not found in DB',
					});
				}
			} catch (err) {
				console.error('Fehler beim Laden des Spielers:', err);
				socket.emit('world:init:error', { message: 'Failed to load player' });
			}
		});

		/**
		 * Bewegung
		 */
		socket.on('playerMovement', (data) => {
			const player = players.get(socket.id);
			if (!player) return;

			player.x = data.x;
			player.y = data.y;
			player.anim = data.anim;

			io.emit('updatePlayers', Object.fromEntries(players));
		});

		/**
		 * Disconnect
		 */
		socket.on('disconnect', (reason) => {
			updatePlayer(players.get(socket.id));
			console.log(`Player disconnected: ${socket.id}`, reason);
			players.delete(socket.id);
			io.emit('playerDisconnected', socket.id);
		});
	});
}
