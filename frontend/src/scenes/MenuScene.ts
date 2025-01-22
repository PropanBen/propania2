import Phaser from 'phaser';
import io from 'socket.io-client';

export default class MenuScene extends Phaser.Scene {
	constructor() {
		super({ key: 'MenuScene' });
	}

	preload() {
		this.load.image('sky', 'assets/images/sky.png');
	}

	create() {
		const socket = io('http://localhost:3001');
		// Hintergrundbild hinzufügen
		const bg = this.add.image(0, 0, 'sky').setOrigin(0, 0);

		// Skalierung berechnen, um den Bildschirm zu füllen
		const scaleX = this.scale.width / bg.width;
		const scaleY = this.scale.height / bg.height;
		const scale = Math.max(scaleX, scaleY); // Wähle die größere Skalierung, um das Bild zu füllen

		bg.setScale(scale);

		// Falls notwendig, das Bild zentrieren
		bg.setPosition(0, 0);

		this.add
			.text(300, 250, 'Klicke, um zu spielen!', {
				fontSize: '32px',
			})
			.setInteractive()
			.on('pointerdown', () => {
				this.scene.start('GameScene');
			});

		// Initialen Text für Nachrichten anzeigen
		const messageText = this.add
			.text(400, 50, '', {
				font: '32px Arial',
				align: 'center',
			})
			.setOrigin(0.5);

		// Wenn der Client eine Nachricht vom Server empfängt
		socket.on('message', (message) => {
			// Die Nachricht im Spiel anzeigen
			messageText.setText(message); // Text im Spiel aktualisieren
		});
	}

	update() {
		// Spiel-Logik für den Update-Loop
	}
}
