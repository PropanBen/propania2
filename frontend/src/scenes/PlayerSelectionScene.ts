import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

export default class PlayerSelectionScene extends Phaser.Scene {
	private socket: Socket;
	private graphics!: Phaser.GameObjects.Graphics;
	private clickSound!: Phaser.Sound.BaseSound;

	constructor() {
		super({ key: 'PlayerSelectionScene' });
		this.socket = io('http://localhost:3001');
	}

	preload() {
		this.load.image('background', 'assets/images/background.png');
		this.load.image('playerselection', 'assets/images/playerselection.png');
		this.load.image('logoutbutton', 'assets/images/logoutbutton.png');
	}

	create() {
		// Sounds

		this.clickSound = this.sound.add('clickSound');

		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;

		// Hintergrundbild hinzufügen
		const bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
		bg.setOrigin(0, 0);

		const propaniaImage = this.add
			.image(centerX, centerY - 250, 'playerselection')
			.setScale(0.8, 0.8);

		// Skalierung berechnen, um den Bildschirm zu füllen
		const scaleX = this.scale.width / bg.width;
		const scaleY = this.scale.height / bg.height;
		const scale = Math.max(scaleX, scaleY);
		bg.setScale(scale);
		bg.setPosition(0, 0);

		this.graphics = this.add.graphics();
		this.graphics.fillStyle(0xdeb887, 1);
		this.graphics.fillRoundedRect(centerX - 150, centerY - 150, 300, 400, 20);

		const loginbutton = this.add
			.image(centerX, centerY + 150, 'loginbutton')
			.setInteractive()
			.setScale(0.3, 0.3)
			.on('pointerdown', () => {
				this.handleLogin();
				this.handleClickSound();
			})
			.on('pointerover', () => {
				loginbutton.setScale(0.31, 0.31);
			})
			.on('pointerout', () => {
				loginbutton.setScale(0.3, 0.3);
			});

		const logoutbutton = this.add
			.image(centerX, centerY + 200, 'logoutbutton')
			.setScale(0.3, 0.3)
			.setInteractive()
			.on('pointerdown', () => {
				this.handleLogout();
				this.handleClickSound();
			})
			.on('pointerover', () => {
				logoutbutton.setScale(0.31, 0.31);
			})
			.on('pointerout', () => {
				logoutbutton.setScale(0.3, 0.3);
			});
	}

	handleLogin() {
		this.scene.start('GameScene');
	}

	handleLogout() {
		localStorage.removeItem('token');
		this.scene.sleep('PlayerSelectionScene');
		this.scene.start('LoginScene');
	}

	handleClickSound() {
		this.clickSound.play();
	}
}
