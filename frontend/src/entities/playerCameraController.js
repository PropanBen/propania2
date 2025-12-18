export default class PlayerCameraController {
	constructor(scene, player) {
		this.scene = scene;
		this.player = player;
		this.camera = scene.cameras.main;

		this.freeMode = false;
		this.dragging = false;
		this.dragX = 0;
		this.dragY = 0;

		this.initCameraFollow();
		this.initInput();
	}

	// -------------------------------------------------------------
	// FOLLOW MODE aktivieren
	// -------------------------------------------------------------
	initCameraFollow() {
		this.camera.startFollow(this.player);
		this.camera.setZoom(2);
	}

	// -------------------------------------------------------------
	// INPUT BINDINGS
	// -------------------------------------------------------------
	initInput() {
		const input = this.scene.input;

		this.keyPlus = input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS);
		this.keyMinus = input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS);
		this.keySpace = input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

		// Wenn FreeCamera aktiv → Drag mit Maus
		input.on("pointerdown", (pointer) => {
			if (this.freeMode && !pointer.rightButtonDown()) {
				this.dragging = true;
				this.dragX = pointer.x;
				this.dragY = pointer.y;
			}
		});

		input.on("pointerup", () => {
			this.dragging = false;
		});

		input.on("pointermove", (pointer) => {
			if (this.freeMode && this.dragging) {
				const dx = this.dragX - pointer.x;
				const dy = this.dragY - pointer.y;

				this.camera.scrollX += dx / this.camera.zoom;
				this.camera.scrollY += dy / this.camera.zoom;

				this.dragX = pointer.x;
				this.dragY = pointer.y;
			}
		});

		// Mausrad für Zoom
		input.on("wheel", (pointer, gameObjects, dx, dy) => {
			if (dy > 0) this.zoomOut();
			else this.zoomIn();
		});
	}

	// -------------------------------------------------------------
	// Update wird vom Player aufgerufen
	// -------------------------------------------------------------
	update() {
		// Umschalten Free Camera
		if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
			this.toggleFreeMode();
		}

		// + / - Zoom
		if (Phaser.Input.Keyboard.JustDown(this.keyPlus)) this.zoomIn();
		if (Phaser.Input.Keyboard.JustDown(this.keyMinus)) this.zoomOut();

		// Bewegung in Free Mode via WASD
		if (this.freeMode) {
			this.moveFreeCamera();
		}
	}

	// -------------------------------------------------------------
	// Free Camera togglen
	// -------------------------------------------------------------
	toggleFreeMode() {
		this.freeMode = !this.freeMode;

		if (this.freeMode) {
			this.camera.stopFollow();
		} else {
			this.camera.startFollow(this.player);
		}
	}

	// -------------------------------------------------------------
	// Kamera bewegen im Free Mode
	// -------------------------------------------------------------
	moveFreeCamera() {
		const speed = 10 / this.camera.zoom;
		const keys = this.scene.input.keyboard.addKeys({
			up: Phaser.Input.Keyboard.KeyCodes.W,
			down: Phaser.Input.Keyboard.KeyCodes.S,
			left: Phaser.Input.Keyboard.KeyCodes.A,
			right: Phaser.Input.Keyboard.KeyCodes.D,
		});

		if (keys.left.isDown) this.camera.scrollX -= speed;
		if (keys.right.isDown) this.camera.scrollX += speed;
		if (keys.up.isDown) this.camera.scrollY -= speed;
		if (keys.down.isDown) this.camera.scrollY += speed;
	}

	// -------------------------------------------------------------
	// Zoom Funktionen
	// -------------------------------------------------------------
	zoomIn() {
		this.camera.zoom = Phaser.Math.Clamp(this.camera.zoom + 0.1, 0.1, 3);
	}

	zoomOut() {
		this.camera.zoom = Phaser.Math.Clamp(this.camera.zoom - 0.1, 0.1, 3);
	}

	// -------------------------------------------------------------
	// CLEANUP
	// -------------------------------------------------------------
	destroy() {
		this.camera.stopFollow();
		this.dragging = false;
	}
}
