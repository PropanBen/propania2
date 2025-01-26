import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

export default class PlayerSelectionScene extends Phaser.Scene {
	private socket: Socket;
	private graphics!: Phaser.GameObjects.Graphics;

	constructor() {
		super({ key: 'PlayerSelectionScene' });
		this.socket = io('http://localhost:3001');
	}

	preload() {
		this.load.image('background', 'assets/images/background.png');
		this.load.image('propania2', 'assets/images/propania2.png');
		this.load.image('loginbutton', 'assets/images/loginbutton.png');
		this.load.image('registerbutton', 'assets/images/registerbutton.png');
	}

	create() {
		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;

		// Hintergrundbild hinzufügen
		const bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
		bg.setOrigin(0, 0);

		// Skalierung berechnen, um den Bildschirm zu füllen
		const scaleX = this.scale.width / bg.width;
		const scaleY = this.scale.height / bg.height;
		const scale = Math.max(scaleX, scaleY);
		bg.setScale(scale);
		bg.setPosition(0, 0);

		this.graphics = this.add.graphics();
		this.graphics.fillStyle(0xdeb887, 1);
		this.graphics.fillRoundedRect(centerX - 150, centerY - 150, 300, 400, 20);
	}
}
