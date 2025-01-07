import CameraControl from '../controls/CameraControl.js';
import InputManager from '../controls/InputManager.js';
import AnimationManager from '../animations/AnimationManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.cameraControl = null;
        this.inputManager = null;
        this.animationManager = null;
        this.actionzoneOffset = null;
        this.blueRectangle = null;
    }

    preload() {
        // Assets laden
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
        // Spieler erstellen
        const idleIndex = 26; // Beispiel: Idle-Frame
        this.player = this.physics.add.sprite(-200, 900, 'player', idleIndex).setOrigin(0.5, 0.5).setScale(0.5);
        this.physics.world.enable(this.player);
        this.player.body.setSize(16, 16);
        this.player.setDepth(10);
        this.scene.launch('UIScene');

        // Actionzone erstellen
        this.actionzoneOffset = { x: 10, y: 10 }; // Offset für die actionzone relativ zum Spieler
        this.actionzone = this.add.rectangle(
            this.player.x + this.actionzoneOffset.x,
            this.player.y + this.actionzoneOffset.y,
            10, 10, 0xff0000, 0.5
        );
        this.physics.add.existing(this.actionzone, false); // **Dynamisch statt statisch**
        this.actionzone.body.setImmovable(true); // Kann nicht von anderen Objekten verschoben werden
        this.actionzone.setDepth(11);

        const rectangleOffset = { x: 50, y: 0 }; // Position relativ zum Spieler
        this.blueRectangle = this.add.rectangle(
            -150, 900,
            20, 20, 0x0000ff, 0.5
        );
        this.physics.add.existing(this.blueRectangle);
        this.blueRectangle.body.setImmovable(true);
        this.blueRectangle.setDepth(10);

        // Karte erstellen
        const map = this.make.tilemap({ key: 'map' });
        const groundTiles = map.addTilesetImage('Ground', 'ground');
        const treeLeavesTiles = map.addTilesetImage('TreeLeaves', 'treeleaves');
        const treesTiles = map.addTilesetImage('Trees', 'trees');

        this.groundLayer = map.createLayer('Ground', groundTiles, 0, 0);
        this.obstaclesLayer = map.createLayer('Obstacles', [treeLeavesTiles, treesTiles], 0, 0);
        this.obstaclesLayer.setCollisionByExclusion([-1]);
        this.physics.add.collider(this.player, this.obstaclesLayer);

        // Kollisionserkennung für Zone
        this.physics.add.collider(this.actionzone, this.blueRectangle);
        this.physics.add.overlap(this.actionzone, this.blueRectangle, this.handleactionzoneCollision, null, this);

        // Input Manager und Kamera-Steuerung
        this.inputManager = new InputManager(this, this.player, null);
        this.cameraControl = new CameraControl(this, this.player);

        // Animationen
        this.animationManager = new AnimationManager(this, this.player);
    }

    update() {
        // Spielerbewegung
        const Velocity = this.inputManager.handlePlayerMovement();
        const direction = this.inputManager.getDirection(); // Verwende getDirection aus InputManager
        this.animationManager.playAnimation(direction, Velocity);
    
        // Kamera aktualisieren
        this.cameraControl.update();
    
        // Spielerdaten an UIScene senden
        this.scene.get('UIScene').events.emit('updatePlayerPosition', this.player.x, this.player.y);
    
        // Actionzone mit dem Spieler bewegen
        this.actionzone.setPosition(this.player.x + this.actionzoneOffset.x, this.player.y + this.actionzoneOffset.y);
    
        this.setactionzoneDirection(this.actionzone, this.actionzoneOffset, direction);
    }
    

    setactionzoneDirection(actionzone, actionzoneOffset, direction) {
        const offsets = {
            left: { x: -10, y: 10 },
            right: { x: 10, y: 10 },
            up: { x: 0, y: 0 },
            down: { x: 0, y: 20 }
        };

        if (offsets[direction]) {
            actionzoneOffset.x = offsets[direction].x;
            actionzoneOffset.y = offsets[direction].y;
        }

        (direction === 'up') ? actionzone.setDepth(8) : actionzone.setDepth(11);
    }

    handleactionzoneCollision(zone, obstacle) {
        console.log('Zone hat ein Hindernis berührt!');
    }
}
