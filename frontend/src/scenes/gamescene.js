import Player from '../entities/player';
import { socket } from '../socket.js';
import Phaser from 'phaser';
import { preloadAssets } from '../assets/utils/gamesceneassetloader.js';
import { registerPlayerAnimations } from '../assets/utils/animations.js';

export default class GameScene extends Phaser.Scene {
	constructor(data) {
		super('GameScene');
		this.player = null;
	}

	init(data) {
		this.player_id = data?.player_id ?? null;
		this.account_id = data?.account_id ?? null;
	}

	preload() {
		preloadAssets(this);
	}

	create() {
		this.socket = socket;
		this.players = {};
		this.playerGroup = this.physics.add.group();
		registerPlayerAnimations(this);

		//Map
		// Karte erstellen
		const map = this.make.tilemap({ key: 'map' });
		const groundTiles = map.addTilesetImage('Ground', 'ground');
		const groundLayer = map.createLayer('Ground', groundTiles, 0, 0);
		groundLayer.setScale(4);

		// ⚡ Spieler-Kollision aktivieren
		this.physics.add.collider(this.playerGroup, this.playerGroup);

		// Socket Events
		this.socket.on('currentPlayers', (players) => {
			Object.values(players).forEach((player) => {
				this.addPlayer(player, player.socket_id === this.socket.id);
			});
		});

		this.socket.on('newPlayer', (playerInfo) => {
			this.addPlayer(playerInfo, false);
		});

		this.socket.on('updatePlayers', (players) => {
			Object.values(players).forEach((player) => {
				if (
					this.players[player.socket_id] &&
					!this.players[player.socket_id].isLocalPlayer
				) {
					this.players[player.socket_id].setPosition(player.x, player.y);
					this.players[player.socket_id].play(player.anim, true);
				}
			});
		});

		this.socket.on('playerDisconnected', (socket_id) => {
			if (this.players[socket_id]) {
				this.players[socket_id].nameText.destroy();
				this.players[socket_id].destroy();
				delete this.players[socket_id];
			}
		});

		// Nach Verbindung -> Init anfordern
		this.socket.emit('world:init:request', { player_id: this.player_id }); // ⚡ hier deine Player-ID aus DB einsetzen
	}

	addPlayer(playerInfo, isLocal) {
		const player = new Player(this, playerInfo, isLocal);
		this.players[player.socket_id] = player;
		this.playerGroup.add(player);
		this.player = player;
	}

	update() {
		if (this.players[this.socket.id]) {
			this.players[this.socket.id].update();
		}
	}
}
