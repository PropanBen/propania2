import LoginScene from './scenes/LoginScene.js';
import PlayerSelectionScene from './scenes/PlayerSelectionScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import IsoMapScene from './scenes/IsoMapScene.js';

//import { Phaser } from 'phaser';
import { io } from 'socket.io-client'; // Verwende diese Variante, falls es zu Problemen kommt
import type { Types } from 'phaser';
import { Game, AUTO, Scale } from 'phaser';

// Hier kannst du direkt den globalen `io`-Namespace von Socket.IO verwenden
const socket = io('http://localhost:3001'); // Verbinde mit dem Server

// Phaser.js-Konfiguration
const config: Types.Core.GameConfig = {
	type: AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	parent: 'game-container',
	scale: {
		mode: Scale.FIT, // Passt das Spiel in den verfügbaren Platz ein
		autoCenter: Scale.CENTER_BOTH, // Zentriert das Spiel
	},
	scene: [LoginScene, PlayerSelectionScene, GameScene, UIScene, IsoMapScene],
	physics: {
		default: 'arcade', // Arcade Physics aktivieren
		arcade: {
			gravity: {
				y: 0,
				x: 0,
			}, // Keine Schwerkraft, falls nicht benötigt
			debug: false, // Optional: Falls du Kollisionen debuggen möchtest, kannst du
		},
	},
};

const game = new Game(config);
