// InputManager.js
export default class InputManager {
    constructor(scene, player, cameraControl) {
        this.scene = scene;
        this.player = player;
        this.cameraControl = cameraControl; // Übergibt die Instanz von CameraControl
        this.cursors = this.scene.input.keyboard.createCursorKeys();
    }

    handleZoom(pointer, gameObjects, deltaX, deltaY) {
        // Hier greifen wir direkt auf cameraControl.adjustZoom zu
        const zoomFactor = deltaY > 0 ? 0.1 : -0.1;
        this.cameraControl.adjustZoom(zoomFactor);  // Zoom-Funktion wird direkt von CameraControl aufgerufen
    }

    handlePlayerMovement() {
        // Logik für die Steuerung des Spielers
        let isRunning = false;
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            isRunning = true;
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            isRunning = true;
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-160);
            isRunning = true;
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(160);
            isRunning = true;
        } else {
            this.player.setVelocityY(0);
        }

        return isRunning;
    }
}
