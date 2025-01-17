import Phaser from 'phaser';

// CameraControl.js
export default class CameraControl {
	constructor(scene, player) {
		this.scene = scene;
		this.player = player;
		this.isCameraFollowing = true; // Kamera folgt dem Spieler standardmäßig
		this.cameraZoom = 3; // Initialer Zoom-Level
		this.dragging = false; // Steuerung für Kamera-Ziehen
		this.startDragX = 0;
		this.startDragY = 0;

		// Kamera folgt dem Spieler zu Beginn
		this.scene.cameras.main.startFollow(this.player);
		this.scene.cameras.main.setFollowOffset(0, 0);
		this.scene.cameras.main.setZoom(this.cameraZoom);

		// Ereignis-Listener für Maus und Tasten
		this.scene.input.on('pointerdown', this.startDrag, this);
		this.scene.input.on('pointerup', this.stopDrag, this);
		this.scene.input.on('pointermove', this.dragCamera, this);
		this.scene.input.keyboard.on(
			'keydown-SPACE',
			this.toggleCameraFollow,
			this
		);
		this.scene.input.on('wheel', this.handleZoom, this);
		this.scene.input.keyboard.on('keydown-NUMPAD_ADD', this.zoomIn, this);
		this.scene.input.keyboard.on('keydown-NUMPAD_SUBTRACT', this.zoomOut, this);
	}

	// Starten des Kamera-Ziehens (dragging)
	startDrag(pointer) {
		this.dragging = true;
		this.startDragX = pointer.worldX;
		this.startDragY = pointer.worldY;
	}

	// Stoppen des Kamera-Ziehens (dragging)
	stopDrag() {
		this.dragging = false;
	}

	// Kamera verschieben, wenn sie gezogen wird
	dragCamera(pointer) {
		if (this.dragging && !this.isCameraFollowing) {
			const deltaX = this.startDragX - pointer.worldX;
			const deltaY = this.startDragY - pointer.worldY;
			this.scene.cameras.main.scrollX += deltaX;
			this.scene.cameras.main.scrollY += deltaY;
			this.startDragX = pointer.worldX;
			this.startDragY = pointer.worldY;
		}
	}

	// Umschalten zwischen "Kamera folgt dem Spieler" und "freie Kamera"
	toggleCameraFollow() {
		this.isCameraFollowing = !this.isCameraFollowing;
		if (this.isCameraFollowing) {
			this.scene.cameras.main.startFollow(this.player);
		} else {
			this.scene.cameras.main.stopFollow();
		}
	}

	// Zoom-Funktionalität mit Maus oder Tasten
	handleZoom(pointer, gameObjects, deltaX, deltaY) {
		const zoomFactor = deltaY < 0 ? 0.1 : -0.1;
		this.adjustZoom(zoomFactor);
	}

	zoomIn() {
		this.adjustZoom(0.1);
	}

	zoomOut() {
		this.adjustZoom(-0.1);
	}

	// Zoom-Level anpassen
	adjustZoom(zoomDelta) {
		this.cameraZoom = Phaser.Math.Clamp(this.cameraZoom + zoomDelta, 0.1, 5); // Begrenzung des Zoom-Levels
		this.scene.cameras.main.setZoom(this.cameraZoom);
	}

	// Kamera folgt dem Spieler (außer bei "free camera" Modus)
	update() {
		if (this.isCameraFollowing) {
			this.scene.cameras.main.scrollX =
				this.player.x - this.scene.cameras.main.width / 2;
			this.scene.cameras.main.scrollY =
				this.player.y - this.scene.cameras.main.height / 2;
		}
	}
}
