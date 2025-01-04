export default class InputManager {
    constructor(scene, player, cameraControl) {
        this.scene = scene;
        this.player = player;
        this.cameraControl = cameraControl;
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.playermovementspeed = 100;


        // Joystick-Bewegungsdaten initialisieren
        this.joystickForceX = 0;
        this.joystickForceY = 0;

        // Joystick-Events abonnieren
        this.scene.scene.get('UIScene').events.on('joystickMove', (forceX, forceY) => {
            this.joystickForceX = forceX;
            this.joystickForceY = forceY;
        });

        // Speichere die letzte Richtung
        this.lastDirection = 'down';
    }

    handlePlayerMovement() {
        let velocityX = 0;
        let velocityY = 0;
    
        // Tastatursteuerung
        if (this.cursors.left.isDown) velocityX = -this.playermovementspeed;
        else if (this.cursors.right.isDown) velocityX = this.playermovementspeed;
    
        if (this.cursors.up.isDown) velocityY = -this.playermovementspeed;
        else if (this.cursors.down.isDown) velocityY = this.playermovementspeed;
    
        // Joysticksteuerung priorisieren, falls vorhanden
        if (this.joystickForceX !== 0 || this.joystickForceY !== 0) {
            velocityX = this.joystickForceX * this.playermovementspeed;
            velocityY = this.joystickForceY * this.playermovementspeed;
        }
    
        // Spielerbewegung anwenden
        this.player.setVelocityX(velocityX);
        this.player.setVelocityY(velocityY);
    
        // Aktualisiere die letzte Richtung basierend auf der Bewegung
        if (velocityX > 0) this.lastDirection = 'right';
        else if (velocityX < 0) this.lastDirection = 'left';
        else if (velocityY > 0) this.lastDirection = 'down';
        else if (velocityY < 0) this.lastDirection = 'up';
    
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
        if (this.cursors.left.isDown) return 'left';
        if (this.cursors.right.isDown) return 'right';
        if (this.cursors.up.isDown) return 'up';
        if (this.cursors.down.isDown) return 'down';

        // Standardwert
        return this.lastDirection; // Zuletzt verwendete Richtung
    }
}
