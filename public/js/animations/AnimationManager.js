export default class AnimationManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // Die letzte Richtung des Spielers speichern
        this.lastDirection = 'down'; // Standardwert, falls der Spieler zu Beginn steht

        // Animationen für den Charakter initialisieren
        this.createAnimations();
    }

    createAnimations() {
        // Idle-Animationen
        this.scene.anims.create({
            key: 'idle_up',
            frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(22, 0), end: this.getFrameIndex(22, 1) }),
            frameRate: 1, // Geschwindigkeit der Animation
            repeat: -1    // Endlos wiederholen
        });

        this.scene.anims.create({
            key: 'idle_down',
            frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(24, 0), end: this.getFrameIndex(24, 1) }),
            frameRate: 1,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'idle_left',
            frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(23, 0), end: this.getFrameIndex(23, 1) }),
            frameRate: 1,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'idle_right',
            frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(25, 0), end: this.getFrameIndex(25, 1) }),
            frameRate: 1,
            repeat: -1
        });

        // Geh-Animationen
        this.scene.anims.create({
            key: 'walk_up',
            frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(8, 0), end: this.getFrameIndex(8, 8) }),
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'walk_down',
            frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(10, 0), end: this.getFrameIndex(10, 8) }),
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'walk_left',
            frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(9, 0), end: this.getFrameIndex(9, 8) }),
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'walk_right',
            frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(11, 0), end: this.getFrameIndex(11, 8) }),
            frameRate: 10,
            repeat: -1
        });

              // Lauf-Animationen
              this.scene.anims.create({
                key: 'run_up',
                frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(34, 0), end: this.getFrameIndex(34, 7) }),
                frameRate: 10,
                repeat: -1
            });
    
            this.scene.anims.create({
                key: 'run_down',
                frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(36, 0), end: this.getFrameIndex(36, 7) }),
                frameRate: 10,
                repeat: -1
            });
    
            this.scene.anims.create({
                key: 'run_left',
                frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(35, 0), end: this.getFrameIndex(35, 7) }),
                frameRate: 10,
                repeat: -1
            });
    
            this.scene.anims.create({
                key: 'run_right',
                frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(37, 0), end: this.getFrameIndex(37, 7) }),
                frameRate: 10,
                repeat: -1
            });
    }

    // Hilfsfunktion zur Berechnung des Frame-Index
    getFrameIndex(row, column) {
        const SPRITESHEET_COLUMNS = 13; // Anzahl der Spalten im Spritesheet
        return (row * SPRITESHEET_COLUMNS) + column;
    }

    // Methode zum Setzen der richtigen Animation basierend auf der Bewegungsrichtung
    playAnimation(direction, velocity) {
        const [velocityX, velocityY] = velocity; // Array entpacken: [x, y]
    
        // Berechne die effektive Geschwindigkeit für jede Richtung
        const absVelocityX = Math.abs(velocityX);
        const absVelocityY = Math.abs(velocityY);
    
        // Horizontalbewegung (left, right)
        if (absVelocityX > absVelocityY) {
            if (absVelocityX > 80) {
                this.lastDirection = 'right'; // Für Running
                this.player.anims.play(velocityX > 0 ? 'run_right' : 'run_left', true);
            } else if (absVelocityX > 0) {
                this.lastDirection = 'right'; // Für Walking
                this.player.anims.play(velocityX > 0 ? 'walk_right' : 'walk_left', true);
            } else {
                // Idle für Horizontal
                this.player.anims.play(this.lastDirection === 'right' ? 'idle_right' : 'idle_left', true);
            }
        }
    
        // Vertikalbewegung (up, down)
        else {
            if (absVelocityY > 80) {
                this.lastDirection = 'down'; // Für Running
                this.player.anims.play(velocityY > 0 ? 'run_down' : 'run_up', true);
            } else if (absVelocityY > 0) {
                this.lastDirection = 'down'; // Für Walking
                this.player.anims.play(velocityY > 0 ? 'walk_down' : 'walk_up', true);
            } else {
                // Idle für Vertikal
                this.player.anims.play(this.lastDirection === 'down' ? 'idle_down' : 'idle_up', true);
            }
        }
    }
    
}
