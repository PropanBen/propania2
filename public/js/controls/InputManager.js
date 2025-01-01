// InputManager.js
import VirtualJoystick from './VirtualJoystick.js';

export default class InputManager {
    constructor(scene, player, cameraControl) {
        this.scene = scene;
        this.player = player;
        this.cameraControl = cameraControl;

        this.cursors = this.scene.input.keyboard.createCursorKeys();

        // Virtuellen Joystick erstellen
        this.joystick = new VirtualJoystick(scene, scene.cameras.main, 50, 50, 50, 30);
    }

    handlePlayerMovement() {
        let velocityX = 0;
        let velocityY = 0;

        // Tastatursteuerung
        if (this.cursors.left.isDown) velocityX = -160;
        else if (this.cursors.right.isDown) velocityX = 160;

        if (this.cursors.up.isDown) velocityY = -160;
        else if (this.cursors.down.isDown) velocityY = 160;

        // Joystick-Steuerung
        const joystickDir = this.joystick.getDirection();
        velocityX += joystickDir.x * 160;
        velocityY += joystickDir.y * 160;

        // Spielerbewegung anwenden
        this.player.setVelocityX(velocityX);
        this.player.setVelocityY(velocityY);

        return velocityX !== 0 || velocityY !== 0; // Gibt zurück, ob sich der Spieler bewegt
    }

    update() {
        // Aktualisiert die Position des Joysticks basierend auf der Kamera
        this.joystick.updatePosition();
    }
}
