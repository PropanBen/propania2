export default class InputManager {
    constructor(scene, player, cameraControl) {
        this.scene = scene;
        this.player = player;
        this.cameraControl = cameraControl;

        // Pfeiltasten und WASD-Tasten für Steuerung
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.keys = this.scene.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
        });

        this.playermovementspeed = 60;
        this.playermovementmaxspeed = 100;
        this.shiftkey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // Joystick-Bewegungsdaten initialisieren
        this.joystickForceX = 0;
        this.joystickForceY = 0;

        // Joystick-Events abonnieren
        this.scene.scene.get('UIScene').events.on('joystickMove', (forceX, forceY) => {
            this.joystickForceX = forceX;
            this.joystickForceY = forceY;
        });

        // Speichere die letzte Richtung
        this.lastDirection = 'down'; // Initialwert
    }

    handlePlayerMovement() {
        let velocityX = 0;
        let velocityY = 0;

        // Überprüfen, ob die Steuerung durch Joystick erfolgt
        const isJoystickActive = this.joystickForceX !== 0 || this.joystickForceY !== 0;

        // Tastatursteuerung (Pfeiltasten und WASD)
        if (!isJoystickActive) {
            if (this.cursors.left.isDown || this.keys.A.isDown) {
                velocityX = -this.playermovementspeed;
                this.lastDirection = 'left'; // Update Richtung basierend auf Tastatur
            } else if (this.cursors.right.isDown || this.keys.D.isDown) {
                velocityX = this.playermovementspeed;
                this.lastDirection = 'right'; // Update Richtung basierend auf Tastatur
            }

            if (this.cursors.up.isDown || this.keys.W.isDown) {
                velocityY = -this.playermovementspeed;
                this.lastDirection = 'up'; // Update Richtung basierend auf Tastatur
            } else if (this.cursors.down.isDown || this.keys.S.isDown) {
                velocityY = this.playermovementspeed;
                this.lastDirection = 'down'; // Update Richtung basierend auf Tastatur
            }
        }

        // Sprinten
        if (this.shiftkey.isDown) {
            this.playermovementspeed = 100;
        } else {
            this.playermovementspeed = 60;
        }

        // Joysticksteuerung priorisieren, falls vorhanden
        if (isJoystickActive) {
            velocityX = this.joystickForceX * this.playermovementmaxspeed;
            velocityY = this.joystickForceY * this.playermovementmaxspeed;

            // Aktualisiere die letzte Richtung basierend auf der Joystick-Bewegung
            if (Math.abs(this.joystickForceX) > Math.abs(this.joystickForceY)) {
                this.lastDirection = this.joystickForceX > 0 ? 'right' : 'left';
            } else {
                this.lastDirection = this.joystickForceY > 0 ? 'down' : 'up';
            }
        }

        // Spielerbewegung anwenden
        this.player.setVelocityX(velocityX);
        this.player.setVelocityY(velocityY);

        // Event an UIScene senden
        this.scene.scene.get('UIScene').events.emit('updateVelocity', velocityX, velocityY);

        // Rückgabe der Geschwindigkeiten als Array
        return [velocityX, velocityY];
    }

    getDirection() {
        // Priorisiere Joystick-Eingaben
        if (this.joystickForceX !== 0 || this.joystickForceY !== 0) {
            if (Math.abs(this.joystickForceX) > Math.abs(this.joystickForceY)) {
                return this.joystickForceX > 0 ? 'right' : 'left';
            } else {
                return this.joystickForceY > 0 ? 'down' : 'up';
            }
        }

        // Fallback auf Tastatursteuerung
        if (this.cursors.left.isDown || this.keys.A.isDown) return 'left';
        if (this.cursors.right.isDown || this.keys.D.isDown) return 'right';
        if (this.cursors.up.isDown || this.keys.W.isDown) return 'up';
        if (this.cursors.down.isDown || this.keys.S.isDown) return 'down';
     
        this.scene.scene.get('UIScene').events.emit('lastDirection',this.lastDirection);

        // Standardwert
        return this.lastDirection; // Zuletzt verwendete Richtung
    }
}
