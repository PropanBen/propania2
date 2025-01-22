import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

export default class MenuScene extends Phaser.Scene {
	private emailInput!: HTMLInputElement;
	private passwordInput!: HTMLInputElement;
	private feedbackText!: Phaser.GameObjects.Text;
	private socket: Socket;
	private graphics!: Phaser.GameObjects.Graphics;

	constructor() {
		super({ key: 'MenuScene' });
		this.socket = io('http://localhost:3001');
	}

	preload() {
		this.load.image('background', 'assets/images/background.png');
		this.load.image('propania2', 'assets/images/propania2.png');
	}

	create() {
		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;

		// Hintergrundbild hinzufügen
		const bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
		bg.setOrigin(0, 0);

		this.graphics = this.add.graphics();
		this.graphics.fillStyle(0xdeb887, 1);
		this.graphics.fillRoundedRect(centerX - 150, centerY - 150, 300, 300, 20);

		const propaniaImage = this.add
			.image(centerX, centerY - 250, 'propania2')
			.setScale(0.8, 0.8);

		// Skalierung berechnen, um den Bildschirm zu füllen
		const scaleX = this.scale.width / bg.width;
		const scaleY = this.scale.height / bg.height;
		const scale = Math.max(scaleX, scaleY);
		bg.setScale(scale);
		bg.setPosition(0, 0);

		// Berechne die Positionen für das responsive Login-Formular
		const inputWidth = 200;
		const inputHeight = 30;
		const gap = 20; // Abstand zwischen den Eingabefeldern

		// E-Mail-Eingabefeld erstellen und zentrieren
		this.emailInput = document.createElement('input');
		this.emailInput.type = 'email';
		this.emailInput.placeholder = 'E-Mail-Adresse';
		this.emailInput.style.position = 'absolute';
		this.emailInput.style.left = `${centerX - inputWidth / 2}px`;
		this.emailInput.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap)}px`;
		this.emailInput.style.width = `${inputWidth}px`;
		this.emailInput.style.height = `${inputHeight}px`;
		this.emailInput.style.fontSize = '16px';
		this.emailInput.style.zIndex = '10'; // Sicherstellen, dass das Eingabefeld im Vordergrund bleibt

		// Passwort-Eingabefeld erstellen und zentrieren
		this.passwordInput = document.createElement('input');
		this.passwordInput.type = 'password';
		this.passwordInput.placeholder = 'Passwort';
		this.passwordInput.style.position = 'absolute';
		this.passwordInput.style.left = `${centerX - inputWidth / 2}px`;
		this.passwordInput.style.top = `${centerY - inputHeight / 2}px`;
		this.passwordInput.style.width = `${inputWidth}px`;
		this.passwordInput.style.height = `${inputHeight}px`;
		this.passwordInput.style.fontSize = '16px';
		this.passwordInput.style.zIndex = '10'; // Sicherstellen, dass das Eingabefeld im Vordergrund bleibt

		// Eingabefelder dem Dokument hinzufügen
		document.body.appendChild(this.emailInput);
		document.body.appendChild(this.passwordInput);

		// Login-Button in Phaser zentrieren
		const loginButton = this.add
			.text(centerX - 50, centerY + inputHeight, 'Einloggen', {
				font: '20px Arial',
			})
			.setInteractive()
			.on('pointerdown', () => this.handleLogin());

		// Rückmeldungstext initialisieren
		this.feedbackText = this.add.text(
			centerX - 150,
			centerY + inputHeight + 30,
			'',
			{
				font: '20px Arial',
			}
		);

		// Empfang von Servernachrichten
		this.socket.on('loginSuccess', (message: string) => {
			console.log(message); // z.B. "Login erfolgreich"
		});

		this.socket.on('loginFailed', (message: string) => {
			console.log(message); // z.B. "Ungültige Anmeldedaten"
		});

		this.add
			.text(centerX - 100, centerY + inputHeight + 70, 'Zum Spiel', {
				fontSize: '32px',
			})
			.setInteractive()
			.on('pointerdown', () => {
				this.scene.start('GameScene');
				this.scene.sleep();
				this.deactivateInputs();
			});

		// Initialen Text für Nachrichten anzeigen
		const messageText = this.add
			.text(centerX, centerY - 150, '', {
				font: '32px Arial',
				align: 'center',
			})
			.setOrigin(0.5);

		// Empfang von Nachrichten vom Server (verwendet die `socket`-Eigenschaft)
		this.socket.on('message', (message: string) => {
			// Die Nachricht im Spiel anzeigen
			messageText.setText(message); // Text im Spiel aktualisieren
		});
	}

	update() {
		// Spiel-Logik für den Update-Loop
	}

	handleLogin() {
		const email = this.emailInput.value;
		const password = this.passwordInput.value;

		// Einfache Validierung
		if (!email || !password) {
			this.feedbackText.setText('Bitte alle Felder ausfüllen!');
			return;
		}

		// Verarbeitung der Eingaben (z.B. an einen Server senden)
		console.log('E-Mail:', email);
		console.log('Passwort:', password);

		// Rückmeldung anzeigen
		this.feedbackText.setText(`Willkommen, ${email}!`);

		// Eingabefelder nach Login entfernen
		this.emailInput.remove();
		this.passwordInput.remove();
	}

	// Wenn die Szene gewechselt wird, deaktiviere die Eingabefelder
	// und stelle sicher, dass sie nicht mehr sichtbar sind.
	public deactivateInputs() {
		this.emailInput.style.display = 'none';
		this.passwordInput.style.display = 'none';
	}
}
