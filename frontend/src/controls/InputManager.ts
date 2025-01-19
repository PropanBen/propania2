import Phaser from 'phaser';
import { Direction } from '../types/direction.enum';
import type CameraControl from './CameraControl';

export default class InputManager {
	private lastDirection?: Direction;

	private playerMovementSpeed?: number;
	private readonly PLAYER_MOVEMENT_MAX_SPEED: number;

	private scene?: Phaser.Scene;
	private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	private cameraControl?: CameraControl;
	private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
	private keys?: Record<string, Phaser.Input.Keyboard.Key> = {};
	private shiftkey?: unknown;
	private joystickForceX?: number;
	private joystickForceY?: number;

	constructor(
		scene: Phaser.Scene,
		player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
		cameraControl: CameraControl
	) {
		this.scene = scene;
		this.player = player;
		this.cameraControl = cameraControl;

		// Pfeiltasten und WASD-Tasten für Steuerung
		this.cursors = this.scene.input.keyboard!.createCursorKeys();
		this.initializeKeys();

		this.playerMovementSpeed = 60;
		this.PLAYER_MOVEMENT_MAX_SPEED = 100;

		// Joystick-Bewegungsdaten initialisieren
		this.joystickForceX = 0;
		this.joystickForceY = 0;

		// Joystick-Events abonnieren
		this.scene.scene
			.get('UIScene')
			.events.on('joystickMove', (forceX: number, forceY: number) => {
				this.joystickForceX = forceX;
				this.joystickForceY = forceY;
			});

		// Speichere die letzte Richtung
		this.lastDirection = Direction.DOWN; // Initialwert
	}

	handlePlayerMovement() {
		let velocityX = 0;
		let velocityY = 0;

		// Überprüfen, ob die Steuerung durch Joystick erfolgt
		const isJoystickActive =
			this.joystickForceX !== 0 || this.joystickForceY !== 0;

		// Tastatursteuerung (Pfeiltasten und WASD)
		if (!isJoystickActive) {
			if (this.cursors!.left.isDown || this.keys!['A'].isDown) {
				velocityX = -this.playerMovementSpeed!;
				this.lastDirection = Direction.LEFT; // Update Richtung basierend auf Tastatur
			} else if (this.cursors!.right.isDown || this.keys!['D'].isDown) {
				velocityX = this.playerMovementSpeed!;
				this.lastDirection = Direction.RIGHT; // Update Richtung basierend auf Tastatur
			}

			if (this.cursors!.up.isDown || this.keys!['W'].isDown) {
				velocityY = -this.playerMovementSpeed!;
				this.lastDirection = Direction.UP; // Update Richtung basierend auf Tastatur
			} else if (this.cursors!.down.isDown || this.keys!['S'].isDown) {
				velocityY = this.playerMovementSpeed!;
				this.lastDirection = Direction.DOWN; // Update Richtung basierend auf Tastatur
			}
		}

		// Sprinten
		if (this.keys!['Shift'].isDown) {
			this.playerMovementSpeed = 100;
		} else {
			this.playerMovementSpeed = 60;
		}

		// Joysticksteuerung priorisieren, falls vorhanden
		if (isJoystickActive) {
			velocityX = this.joystickForceX! * this.PLAYER_MOVEMENT_MAX_SPEED;
			velocityY = this.joystickForceY! * this.PLAYER_MOVEMENT_MAX_SPEED;

			// Aktualisiere die letzte Richtung basierend auf der Joystick-Bewegung
			if (Math.abs(this.joystickForceX!) > Math.abs(this.joystickForceY!)) {
				this.lastDirection =
					this.joystickForceX! > 0 ? Direction.RIGHT : Direction.LEFT;
			} else {
				this.lastDirection =
					this.joystickForceY! > 0 ? Direction.DOWN : Direction.UP;
			}
		}

		// Spielerbewegung anwenden
		this.player!.setVelocityX(velocityX);
		this.player!.setVelocityY(velocityY);

		// Event an UIScene senden
		this.scene!.scene.get('UIScene').events.emit(
			'updateVelocity',
			velocityX,
			velocityY
		);

		// Rückgabe der Geschwindigkeiten als Array
		return [velocityX, velocityY];
	}

	getDirection(): Direction {
		// Priorisiere Joystick-Eingaben
		if (this.joystickForceX !== 0 || this.joystickForceY !== 0) {
			if (Math.abs(this.joystickForceX!) > Math.abs(this.joystickForceY!)) {
				return this.joystickForceX! > 0 ? Direction.RIGHT : Direction.LEFT;
			} else {
				return this.joystickForceY! > 0 ? Direction.DOWN : Direction.UP;
			}
		}

		// Fallback auf Tastatursteuerung
		if (this.cursors!.left.isDown || this.keys!['A'].isDown) {
			return Direction.LEFT;
		}
		if (this.cursors!.right.isDown || this.keys!['D'].isDown) {
			return Direction.RIGHT;
		}
		if (this.cursors!.up.isDown || this.keys!['W'].isDown) {
			return Direction.UP;
		}
		if (this.cursors!.down.isDown || this.keys!['S'].isDown) {
			return Direction.DOWN;
		}

		this.scene!.scene.get('UIScene').events.emit(
			'lastDirection',
			this.lastDirection
		);

		// Standardwert
		return this.lastDirection!; // Zuletzt verwendete Richtung
	}

	initializeKeys(): void {
		this.keys!['W'] = this.scene!.input.keyboard!.addKey(
			Phaser.Input.Keyboard.KeyCodes.W
		);
		this.keys!['A'] = this.scene!.input.keyboard!.addKey(
			Phaser.Input.Keyboard.KeyCodes.A
		);
		this.keys!['S'] = this.scene!.input.keyboard!.addKey(
			Phaser.Input.Keyboard.KeyCodes.S
		);
		this.keys!['D'] = this.scene!.input.keyboard!.addKey(
			Phaser.Input.Keyboard.KeyCodes.D
		);
		this.keys!['Shift'] = this.scene!.input.keyboard!.addKey(
			Phaser.Input.Keyboard.KeyCodes.SHIFT
		);
	}
}
