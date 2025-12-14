// src/entities/PlayerMovementController.js

export default class PlayerMovementController {
	constructor(scene, player) {
		this.scene = scene;
		this.player = player;

		// Geschwindigkeiten
		this.walkSpeed = 200;
		this.runSpeed = 350;

		// Nur lokaler Spieler bekommt Input
		if (this.player.isLocal()) {
			this.keys = scene.input.keyboard.addKeys({
				up: Phaser.Input.Keyboard.KeyCodes.W,
				down: Phaser.Input.Keyboard.KeyCodes.S,
				left: Phaser.Input.Keyboard.KeyCodes.A,
				right: Phaser.Input.Keyboard.KeyCodes.D,
				shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
			});
		}

		this.joystickIsRunning = false;
	}

	update() {
		// Remote Player → keine Bewegung
		if (!this.player.isLocal()) return;

		// Wenn gerade eine Aktion läuft, Movement komplett stoppen und nicht den State überschreiben
		if (this.player.state === "action") {
			this.player.setVelocity(0, 0);
			// Optional: setze depth/z-index oder sonstiges hier, falls nötig
			return;
		}

		// Free-Camera aktiv → Player darf sich nicht bewegen
		if (this.player.camera?.freeMode) {
			this.player.setVelocity(0, 0);
			this.player.state = "idle";
			return;
		}

		// Geschwindigkeit basierend auf Input
		const velocity = this.calculateMovement();
		this.player.setVelocity(velocity.x, velocity.y);

		// Zustand setzen: idle / walk / run
		if (velocity.x === 0 && velocity.y === 0) {
			this.player.state = "idle";
		} else {
			const isRunning = (this.keys?.shift?.isDown || this.joystickIsRunning) ?? false;
			this.player.state = isRunning ? "run" : "walk";
		}
	}

	calculateMovement() {
		let vx = 0;
		let vy = 0;

		// Joystick
		const ui = this.scene.scene.get("UIScene");
		const joy = ui ? ui.getJoystickVector() : { x: 0, y: 0 };
		const joyLength = Math.hypot(joy.x, joy.y);
		const joyActive = joyLength > 0.2;
		this.joystickIsRunning = joyLength > 0.75;

		const currentSpeed = this.keys?.shift?.isDown || this.joystickIsRunning ? this.runSpeed : this.walkSpeed;

		// -----------------------
		// Joystick Input
		// -----------------------
		if (joyActive) {
			vx = joy.x * currentSpeed;
			vy = joy.y * currentSpeed;
			this.updateDirection(joy.x, joy.y);
			return { x: vx, y: vy };
		}

		// -----------------------
		// Keyboard Input
		// -----------------------
		if (this.keys?.left?.isDown) {
			vx = -currentSpeed;
			this.player.lastDirection = "left";
		} else if (this.keys?.right?.isDown) {
			vx = currentSpeed;
			this.player.lastDirection = "right";
		}

		if (this.keys?.up?.isDown) {
			vy = -currentSpeed;
			this.player.lastDirection = "up";
		} else if (this.keys?.down?.isDown) {
			vy = currentSpeed;
			this.player.lastDirection = "down";
		}

		return { x: vx, y: vy };
	}

	updateDirection(x, y) {
		if (Math.abs(x) > Math.abs(y)) {
			this.player.lastDirection = x > 0 ? "right" : "left";
		} else {
			this.player.lastDirection = y > 0 ? "down" : "up";
		}
	}
}
