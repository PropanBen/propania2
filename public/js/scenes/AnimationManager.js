export default class AnimationManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // Animationen für den Charakter initialisieren
        this.createAnimations();
    }

    createAnimations() {
        // Idle-Animationen (die Frames aus dem Spritesheet sind angegeben)
        this.scene.anims.create({
            key: 'idle_up',
            frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(0, 0), end: this.getFrameIndex(0, 3) }),
            frameRate: 4,  // Geschwindigkeit der Animation
            repeat: -1      // Endlos wiederholen
        });

        this.scene.anims.create({
            key: 'idle_down',
            frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(2, 0), end: this.getFrameIndex(2, 1) }),
            frameRate: 1,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'idle_left',
            frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(1, 0), end: this.getFrameIndex(1, 3) }),
            frameRate: 4,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'idle_right',
            frames: this.scene.anims.generateFrameNumbers('player', { start: this.getFrameIndex(3, 0), end: this.getFrameIndex(3, 3) }),
            frameRate: 4,
            repeat: -1
        });

        // Lauf-Animationen (Frames von Start bis End)
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
            switch (direction) {
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
