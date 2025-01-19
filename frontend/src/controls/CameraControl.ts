import Phaser from 'phaser';
import type { Vector2D } from 'src/types/direction.enum';

// CameraControl.js
export default class CameraControl {
	private scene: Phaser.Scene;
	private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	private isCameraFollowing: boolean;
	private cameraZoom: number;
	private dragging: boolean;
	private startDrag: Vector2D;

	constructor(
		scene: Phaser.Scene,
		player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
	) {
		this.scene = scene;
		this.player = player;
		this.isCameraFollowing = true; // Kamera folgt dem Spieler standardmäßig
		this.cameraZoom = 3; // Initialer Zoom-Level
		this.dragging = false; // Steuerung für Kamera-Ziehen
		this.startDrag = { x: 0, y: 0 };

		// Kamera folgt dem Spieler zu Beginn
		this.scene.cameras.main.startFollow(this.player);
		this.scene.cameras.main.setFollowOffset(0, 0);
		this.scene.cameras.main.setZoom(this.cameraZoom);

		// Ereignis-Listener für Maus und Tasten
		this.scene.input.on('pointerdown', this.startDragging, this);
		this.scene.input.on('pointerup', this.stopDrag, this);
		this.scene.input.on('pointermove', this.dragCamera, this);
		this.scene.input.keyboard!.on(
			'keydown-SPACE',
			this.toggleCameraFollow,
			this
		);
		this.scene.input.on('wheel', this.handleZoom, this);
		this.scene.input.keyboard!.on('keydown-NUMPAD_ADD', this.zoomIn, this);
		this.scene.input.keyboard!.on(
			'keydown-NUMPAD_SUBTRACT',
			this.zoomOut,
			this
		);
	}

	// Starten des Kamera-Ziehens (dragging)
	startDragging(pointer: Phaser.Input.Pointer) {
		this.dragging = true;
		this.startDrag = { x: pointer.worldX, y: pointer.worldY };
	}

	// Stoppen des Kamera-Ziehens (dragging)
	stopDrag() {
		this.dragging = false;
	}

	// Kamera verschieben, wenn sie gezogen wird
	dragCamera(pointer: Phaser.Input.Pointer) {
		if (this.dragging && !this.isCameraFollowing) {
			const deltaX = this.startDrag.x - pointer.worldX;
			const deltaY = this.startDrag.y - pointer.worldY;
			this.scene.cameras.main.scrollX += deltaX;
			this.scene.cameras.main.scrollY += deltaY;
			this.startDrag = { x: pointer.worldX, y: pointer.worldY };
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
	handleZoom(
		pointer: unknown,
		gameObjects: unknown,
		deltaX: number,
		deltaY: number
	) {
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
	adjustZoom(zoomDelta: number) {
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
