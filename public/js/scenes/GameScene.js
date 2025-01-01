
import CameraControl from '../controls/CameraControl.js';
import InputManager from '../controls/InputManager.js';
import VirtualJoystick from '../controls/VirtualJoystick.js';
import AnimationManager from '../animations/AnimationManager.js';
import UI from '../UI/UI.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.cameraControl = null;
        this.inputManager = null;
        this.animationManager = null;
        this.joystick = null;
        this.UI= null; 
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
        this.UI = new UI(this,this.player)
        this.UI.create();

    
        // Karte erstellen
        const map = this.make.tilemap({ key: 'map' });
        const groundTiles = map.addTilesetImage('Ground', 'ground');
        const treeLeavesTiles = map.addTilesetImage('TreeLeaves', 'treeleaves');
        const treesTiles = map.addTilesetImage('Trees', 'trees');

        this.groundLayer = map.createLayer('Ground', groundTiles, 0, 0);
        this.obstaclesLayer = map.createLayer('Obstacles', [treeLeavesTiles, treesTiles], 0, 0);
        this.obstaclesLayer.setCollisionByExclusion([-1]);
        this.physics.add.collider(this.player, this.obstaclesLayer);

        // Input Manager und Kamera-Steuerung
        this.inputManager = new InputManager(this, this.player, null);
        this.cameraControl = new CameraControl(this, this.player);

        // Animationen
        this.animationManager = new AnimationManager(this, this.player);

        // Virtuellen Joystick erstellen
        this.joystick = new VirtualJoystick(this, this.cameras.main, 100, 500, 60, 30);
    }

    update() {
        // Spielerbewegung
        const isRunning = this.inputManager.handlePlayerMovement();

        // UI Updaten
        this.UI.update();

    
        let direction = 'down'; // Standardrichtung
        if (this.inputManager.cursors.up.isDown) direction = 'up';
        else if (this.inputManager.cursors.down.isDown) direction = 'down';
        else if (this.inputManager.cursors.left.isDown) direction = 'left';
        else if (this.inputManager.cursors.right.isDown) direction = 'right';

        this.animationManager.playAnimation(direction, isRunning);

        // Kamera aktualisieren
        this.cameraControl.update();

        // Joystick-Position anpassen
        this.joystick.updatePosition();

        // Spielerbewegung mit Joystick-Richtung kombinieren
        const joystickDirection = this.joystick.getDirection();
        if (joystickDirection.x !== 0 || joystickDirection.y !== 0) {
            const speed = 160;
            this.player.setVelocityX(joystickDirection.x * speed);
            this.player.setVelocityY(joystickDirection.y * speed);
        }
    }
}
