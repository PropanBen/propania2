export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Füge den Text in der linken unteren Ecke hinzu
        this.uiText = this.add.text(10, this.cameras.main.height - 30, 'Player Position: (0, 0)', {
            fontSize: '18px',
            color: '#ffffff',
        }).setScrollFactor(0);

        this.velocityText = this.add.text(10, this.cameras.main.height - 200, 'Velocity: (0, 0)', {
            fontSize: '18px',
            color: '#ffffff',
        }).setScrollFactor(0);




        // Joystick-Position und Größe
        const joystickRadius = 50;
        const joystickX = 100;
        const joystickY = this.cameras.main.height - 100;

        // Joystick-Basis und Stick erstellen
        this.joystickBase = this.add.circle(joystickX, joystickY, joystickRadius, 0x888888).setScrollFactor(0);
        this.joystickStick = this.add.circle(joystickX, joystickY, 25, 0xffffff).setScrollFactor(0);

        // Joystick-Eingabesteuerung
        this.isDragging = false;

        this.input.on('pointerdown', (pointer) => {
            const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, joystickX, joystickY);
            if (distance <= joystickRadius) {
                this.isDragging = true;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                const angle = Phaser.Math.Angle.Between(joystickX, joystickY, pointer.x, pointer.y);
                const distance = Phaser.Math.Clamp(Phaser.Math.Distance.Between(pointer.x, pointer.y, joystickX, joystickY), 0, joystickRadius);

                const stickX = joystickX + Math.cos(angle) * distance;
                const stickY = joystickY + Math.sin(angle) * distance;

                this.joystickStick.setPosition(stickX, stickY);

                // Normalisierte Richtung für Bewegung
                const normalizedX = (stickX - joystickX) / joystickRadius;
                const normalizedY = (stickY - joystickY) / joystickRadius;

                // Sende Bewegungsdaten an die Hauptszene
                this.events.emit('joystickMove', normalizedX, normalizedY);
            }
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
            this.joystickStick.setPosition(joystickX, joystickY);

            // Bewegungsdaten zurücksetzen
            this.events.emit('joystickMove', 0, 0);
        });

        // EventListener für Spielerposition (von der Hauptszene aktualisiert)
        this.events.on('updatePlayerPosition', this.updatePlayerPosition, this);
        this.events.on('updateVelocity', this.updateVelocity, this);
    }

    updatePlayerPosition(playerX, playerY) {
        // Aktualisiere den Text mit der aktuellen Spielerposition
        this.uiText.setText(`Player Position: (${Math.round(playerX)}, ${Math.round(playerY)})`);
    }

    updateVelocity(velocityX, velocityY) {

        this.velocityText.setText(`Velocity: (${Math.round(velocityX)}, ${Math.round(velocityY)}})`);
    }
}
