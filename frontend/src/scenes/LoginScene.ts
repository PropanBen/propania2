import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

export default class LoginScene extends Phaser.Scene {
	private emailtext!: HTMLElement;
	private passwordtext!: HTMLElement;
	private feedbacktext!: HTMLElement; // Hier ist die korrekte Deklaration
	private emailInput!: HTMLInputElement;
	private passwordInput!: HTMLInputElement;
	private socket: Socket;
	private graphics!: Phaser.GameObjects.Graphics;
	private clickSound!: Phaser.Sound.BaseSound;

	constructor() {
		super({ key: 'LoginScene' });
		this.socket = io('http://localhost:3001');
	}

	init() {
		// Überprüfen, ob ein Token vorhanden ist
		const token = localStorage.getItem('token');
		if (token) {
			this.validateToken(token);
		}
	}

	preload() {
		this.load.image('background', 'assets/images/background.png');
		this.load.image('propania2', 'assets/images/propania2.png');
		this.load.image('loginbutton', 'assets/images/loginbutton.png');
		this.load.image('registerbutton', 'assets/images/registerbutton.png');
		this.load.audio('clickSound', 'assets/sounds/click.mp3');
	}

	create() {
		// Sounds

		this.clickSound = this.sound.add('clickSound');

		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;

		// Hintergrundbild hinzufügen
		const bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
		bg.setOrigin(0, 0);

		this.graphics = this.add.graphics();
		this.graphics.fillStyle(0xdeb887, 1);
		this.graphics.fillRoundedRect(centerX - 150, centerY - 150, 300, 400, 20);

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

		// E-Mail-Text erstellen und als Klassenattribute speichern
		this.emailtext = document.createElement('div');
		this.emailtext.style.left = `${centerX - inputWidth / 2 + 70}px`;
		this.emailtext.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap) - 80}px`;
		this.emailtext.innerText = 'E-Mail';
		this.emailtext.style.position = 'absolute';
		document.body.appendChild(this.emailtext);

		// Add it to the DOM
		document.body.appendChild(this.emailtext);

		// E-Mail-Eingabefeld erstellen und zentrieren
		this.emailInput = document.createElement('input');
		this.emailInput.type = 'email';
		this.emailInput.autocomplete = 'email';
		this.emailInput.placeholder = 'E-Mail-Adresse';
		this.emailInput.style.position = 'absolute';
		this.emailInput.style.left = `${centerX - inputWidth / 2}px`;
		this.emailInput.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap) - 50}px`;
		this.emailInput.style.width = `${inputWidth}px`;
		this.emailInput.style.height = `${inputHeight}px`;
		this.emailInput.style.fontSize = '16px';
		this.emailInput.style.zIndex = '10'; // Sicherstellen, dass das Eingabefeld im Vordergrund bleibt

		// Passwort-Text erstellen und als Klassenattribute speichern
		this.passwordtext = document.createElement('div');
		this.passwordtext.style.left = `${centerX - inputWidth / 2 + 70}px`;
		this.passwordtext.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap + 10)}px`;
		this.passwordtext.innerText = 'Password';
		this.passwordtext.style.position = 'absolute';
		document.body.appendChild(this.passwordtext);

		document.body.appendChild(this.passwordtext);

		// Passwort-Eingabefeld erstellen und zentrieren
		this.passwordInput = document.createElement('input');
		this.passwordInput.type = 'password';
		this.passwordInput.autocomplete = 'current-password';
		this.passwordInput.placeholder = 'Passwort';
		this.passwordInput.style.position = 'absolute';
		this.passwordInput.style.left = `${centerX - inputWidth / 2}px`;
		this.passwordInput.style.top = `${centerY - inputHeight / 2 - 25}px`;
		this.passwordInput.style.width = `${inputWidth}px`;
		this.passwordInput.style.height = `${inputHeight}px`;
		this.passwordInput.style.fontSize = '16px';
		this.passwordInput.style.zIndex = '10'; // Sicherstellen, dass das Eingabefeld im Vordergrund bleibt

		// Eingabefelder dem Dokument hinzufügen
		document.body.appendChild(this.emailInput);
		document.body.appendChild(this.passwordInput);

		// Login-Button als Bild erstellen
		const loginButton = this.add
			.image(centerX, centerY + 50, 'loginbutton') // Bild für den Login-Button
			.setInteractive() // Macht das Bild interaktiv
			.setScale(0.3, 0.3)
			.on('pointerdown', () => {
				this.handleLogin(); // Erste Funktion
				this.handleClickSound(); // Zweite Funktion
			})
			.on('pointerover', () => {
				loginButton.setScale(0.31, 0.31);
			})
			.on('pointerout', () => {
				loginButton.setScale(0.3, 0.3);
			});

		// Event-Handler für Klicks

		// Registrieren-Button als Bild erstellen
		const registerButton = this.add
			.image(centerX, centerY + 120, 'registerbutton') // Bild für den Registrieren-Button
			.setInteractive() // Macht das Bild interaktiv
			.setScale(0.3, 0.3)
			.on('pointerdown', () => {
				this.handleRegister(); // Erste Funktion
				this.handleClickSound(); // Zweite Funktion
			})
			.on('pointerover', () => {
				registerButton.setScale(0.31, 0.31);
			})
			.on('pointerout', () => {
				registerButton.setScale(0.3, 0.3);
			});

		// Rückmeldungstext initialisieren
		this.feedbacktext = document.createElement('div');
		this.feedbacktext.style.left = `${centerX - inputWidth / 2 + 30}px`;
		this.feedbacktext.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap - 230)}px`;
		this.feedbacktext.innerText = '';
		this.feedbacktext.style.position = 'absolute';

		document.body.appendChild(this.feedbacktext);

		// Empfang von Servernachrichten
		this.socket.on('loginSuccess', (message: string) => {
			console.log(message); // z.B. "Login erfolgreich"
		});

		this.socket.on('loginFailed', (message: string) => {
			console.log(message); // z.B. "Ungültige Anmeldedaten"
		});

		this.add
			.text(centerX - 100, centerY + inputHeight + 170, 'To the Game', {
				fontSize: '32px',
			})
			.setInteractive()
			.on('pointerdown', () => {
				this.scene.start('GameScene');
				this.scene.sleep();
			});

		// Initialen Text für Nachrichten anzeigen
		const messageText = this.add
			.text(centerX, centerY - 200, '', {
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

	handleRegister() {
		const email = this.emailInput.value;
		const password = this.passwordInput.value;

		if (!email || !password) {
			this.feedbacktext.innerHTML = 'Please fill all fields !';
			return;
		}

		fetch('http://localhost:3001/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		})
			.then((response) => {
				if (response.ok) {
					return response.json() as Promise<{ message: string }>; // Erfolgsfall
				} else {
					// Fehlerfall: Wirft einen Fehler, der im catch-Block behandelt wird
					return response.json().then((errorData: { message: string }) => {
						throw new Error(errorData.message || 'Failed to register');
					});
				}
			})
			.then((data) => {
				// Erfolgreiche Registrierung
				this.feedbacktext.innerHTML = data.message;
			})
			.catch((error) => {
				// Fehlerbehandlung
				console.error('Failed to register:', error.message);
				this.feedbacktext.innerHTML = error.message;
			});
	}

	handleLogin() {
		const email = this.emailInput.value;
		const password = this.passwordInput.value;

		if (!email || !password) {
			this.feedbacktext.innerHTML = 'Please fill all fields !';
			return;
		}

		fetch('http://localhost:3001/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		})
			.then((response) => {
				if (response.ok) {
					return response.json();
				}
				throw new Error('Login failed');
			})
			.then((data) => {
				if (data.token) {
					// Token im localStorage speichern
					localStorage.setItem('token', data.token);
					console.log('Token gespeichert:', data.token); // Debugging
					this.feedbacktext.innerHTML = 'Login successfull!';
					this.deactivateInputs();
					this.scene.start('PlayerSelectionScene');
				} else {
					throw new Error('Undefined Server Error');
				}
			})
			.catch((error) => {
				this.feedbacktext.innerHTML = error.message;
			});
	}

	validateToken(token: string) {
		fetch('http://localhost:3001/validateToken', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`, // Stellen Sie sicher, dass der Token korrekt übermittelt wird
			},
		})
			.then((response) => {
				if (response.ok) {
					// Token ist gültig, weiter zur PlayerSelectionScene
					this.scene.start('PlayerSelectionScene');
				} else {
					// Token ist ungültig, entfernen Sie es aus dem localStorage
					localStorage.removeItem('token');
					throw new Error('Invalid token');
				}
			})
			.catch((error) => {
				console.error('Token validation failed:', error);
			});
	}

	deactivateInputs() {
		this.emailInput.style.display = 'none';
		this.passwordInput.style.display = 'none';
		this.feedbacktext.style.display = 'none';
		this.emailtext.style.display = 'none';
		this.passwordtext.style.display = 'none';
	}

	handleClickSound() {
		this.clickSound.play();
	}
}
