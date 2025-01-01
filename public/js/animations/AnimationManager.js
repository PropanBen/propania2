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
            frameRate: 1,  // Geschwindigkeit der Animation
            repeat: -1      // Endlos wiederholen
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
        const SPRITESHEET_COLUMNS = 13;  // Anzahl der Spalten im Spritesheet
        return (row * SPRITESHEET_COLUMNS) + column;
    }

    // Methode zum Setzen der richtigen Animation basierend auf der Bewegungsrichtung
    playAnimation(direction, isRunning) {
        if (isRunning) {
            this.lastDirection = direction; // Die aktuelle Richtung speichern
            switch (direction) {
                case 'up':
                    this.player.anims.play('run_up', true);
                    break;
                case 'down':
                    this.player.anims.play('run_down', true);
                    break;
                case 'left':
                    this.player.anims.play('run_left', true);
                    break;
                case 'right':
                    this.player.anims.play('run_right', true);
                    break;
            }
        } else {
            // Wenn der Spieler nicht läuft, die letzte Richtung verwenden
            switch (this.lastDirection) {
                case 'up':
                    this.player.anims.play('idle_up', true);
                    break;
                case 'down':
                    this.player.anims.play('idle_down', true);
                    break;
                case 'left':
                    this.player.anims.play('idle_left', true);
                    break;
                case 'right':
                    this.player.anims.play('idle_right', true);
                    break;
            }
        }
    }
}