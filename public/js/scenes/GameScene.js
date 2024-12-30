// GameScene.js
import CameraControl from './CameraControl.js';
import InputManager from './InputManager.js';
import AnimationManager from './AnimationManager.js';  // Importiere den AnimationManager

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.cameraControl = null;
        this.inputManager = null;
        this.animationManager = null;  // Die Instanz des AnimationManagers
        this.stone = null;
    }

    // Hilfsfunktion, um den Frame-Index basierend auf Zeile und Spalte im Spritesheet zu berechnen
    getFrameIndex(row, column) {
        const SPRITESHEET_COLUMNS = 13;  // Anzahl der Spalten im Spritesheet
        return (row * SPRITESHEET_COLUMNS) + column;
    }

    preload() {
        // Lade Assets: Karte und Spieler-Spritesheet
        this.load.tilemapTiledJSON('map', 'assets/map/maps/map.json');
        this.load.image('ground', 'assets/map/images/Ground.png');
        this.load.image('treeleaves', 'assets/map/images/TreeLeaves.png');
        this.load.image('trees', 'assets/map/images/TreeStump.png');
        this.load.image('stone', 'assets/map/images/stone.png');
        this.load.spritesheet('player', 'assets/players/Player_Template.png', {
            frameWidth: 64, 
            frameHeight: 64,
        });
    }

    create() {
        // Erstelle den Spieler
        const idleIndex = this.getFrameIndex(2, 0);
        this.player = this.physics.add.sprite(-200, 900, 'player', idleIndex).setOrigin(0.5, 0.5);
        this.player.setScale(0.5);
        this.physics.world.enable(this.player);
        this.player.body.setCollideWorldBounds(false);
        this.player.body.setSize(16, 16);
        this.player.setDepth(10);

        // Erstelle ein Stein-Objekt für Kollision
        this.stone = this.physics.add.staticSprite(-150, 950, 'stone');
        this.stone.body.setSize(this.stone.width, this.stone.height);
        this.stone.setDepth(10);
        this.physics.add.collider(this.player, this.stone);

        // Lade die Tilemap und erstelle die Layer
        const map = this.make.tilemap({ key: 'map' });
        const groundTiles = map.addTilesetImage('Ground', 'ground');
        const treeLeavesTiles = map.addTilesetImage('TreeLeaves', 'treeleaves');
        const treesTiles = map.addTilesetImage('Trees', 'trees');

        this.groundLayer = map.createLayer('Ground', groundTiles, 0, 0);
        this.buildingsLayer = map.createLayer('Buildings', groundTiles, 0, 0);
        this.collectablesLayer = map.createLayer('Collectables', groundTiles, 0, 0);
        this.obstaclesLayer = map.createLayer('Obstacles', [treeLeavesTiles, treesTiles], 0, 0);
        this.triggersLayer = map.createLayer('Triggers', groundTiles, 0, 0);

        // Kollision zwischen Spieler und Obstacles
        this.physics.add.collider(this.player, this.obstaclesLayer);
        this.obstaclesLayer.setCollisionByExclusion([-1]);

        // Erstelle die Instanzen von InputManager und CameraControl
        this.inputManager = new InputManager(this, this.player);
        this.cameraControl = new CameraControl(this, this.player);

        // Erstelle die Instanz des AnimationManagers
        this.animationManager = new AnimationManager(this, this.player);
    }

    update() {
        // Spielerbewegung und Animationen
        const isRunning = this.inputManager.handlePlayerMovement();

        // Bestimme die Bewegungsrichtung basierend auf den Eingabewerten
        let direction = 'down';  // Standardrichtung
        if (this.inputManager.cursors.up.isDown) {
            direction = 'up';
        } else if (this.inputManager.cursors.down.isDown) {
            direction = 'down';
        } else if (this.inputManager.cursors.left.isDown) {
            direction = 'left';
        } else if (this.inputManager.cursors.right.isDown) {
            direction = 'right';
        }

        // Abspielen der entsprechenden Animation (Laufen oder Idling)
        this.animationManager.playAnimation(direction, isRunning);

        // Update der Kamera
        this.cameraControl.update();
    }
}
