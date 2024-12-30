import SocketManager from '../SocketManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player = null;
    this.stone = null;
    this.isCameraFollowing = true; // Kamera folgt dem Spieler standardmäßig
    this.cameraZoom = 1;  // Initial zoom level (1 means no zoom)
  }

  preload() {
    this.load.tilemapTiledJSON('map', 'assets/map/maps/map.json'); // Lade die JSON-Datei
    this.load.image('ground', 'assets/map/images/Ground.png');      // Tileset Ground
    this.load.image('treeleaves', 'assets/map/images/TreeLeaves.png'); // Tileset TreeLeaves
    this.load.image('trees', 'assets/map/images/TreeStump.png');  
    this.load.image('player', 'assets/players/player.png');  
    this.load.image('stone', 'assets/map/images/stone.png'); // Lade das Bild des Steins
  }

  create() {
    // Create player with physics enabled
    this.player = this.physics.add.sprite(-200, 900, 'player').setOrigin(0.5, 0.5);
    this.physics.world.enable(this.player); // Ermögliche Physik für den Spieler
    this.player.body.setCollideWorldBounds(false); // Spieler kann die Weltgrenzen überschreiten
    this.player.body.setSize(16, 16); // Definiert die Kollisionsgröße (kann angepasst werden)
    this.player.setDepth(10);

    this.stone = this.physics.add.staticSprite(-150, 950, 'stone'); // "staticSprite" für unbewegliche Objekte
    this.stone.body.setSize(this.stone.width, this.stone.height); // Kollisionsgröße anpassen
    this.stone.setDepth(10);

    this.physics.add.collider(this.player, this.stone);

  

    //##################//
    //      TileMap     //
    //##################//

    // Load Tilemap
    const map = this.make.tilemap({ key: 'map' });

    // Register Tilesets in Tilemap
    const groundTiles = map.addTilesetImage('Ground', 'ground');
    const treeLeavesTiles = map.addTilesetImage('TreeLeaves', 'treeleaves');
    const treesTiles = map.addTilesetImage('Trees', 'trees');
    
    // Create Layers
    this.groundLayer = map.createLayer('Ground', groundTiles, 0, 0);
    this.buildingsLayer = map.createLayer('Buildings', groundTiles, 0, 0);
    this.collectablesLayer = map.createLayer('Collectables', groundTiles, 0, 0);
    this.obstaclesLayer = map.createLayer('Obstacles', [treeLeavesTiles, treesTiles], 0, 0);
    this.triggersLayer = map.createLayer('Triggers', groundTiles, 0, 0);
    
  
    this.physics.add.collider(this.player, this.obstaclesLayer);
    this.obstaclesLayer.setCollisionByExclusion([-1]);
  

    //##################//
    //      Kamera      //
    //##################//

    // Kamera folgt dem Spieler
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setFollowOffset(0, 0);

    // Set initial zoom level of the camera
    this.cameraZoom = 2;  // Zoom level (adjust as needed)
    this.cameras.main.setZoom(this.cameraZoom);

    // Mouse input for camera drag (free camera movement)
    this.input.on('pointerdown', (pointer) => {
      this.dragging = true;
      this.startDragX = pointer.worldX;
      this.startDragY = pointer.worldY;
    });

    this.input.on('pointerup', () => {
      this.dragging = false;
    });

    this.input.on('pointermove', (pointer) => {
      if (this.dragging && !this.isCameraFollowing) {
        const deltaX = this.startDragX - pointer.worldX;
        const deltaY = this.startDragY - pointer.worldY;
        this.cameras.main.scrollX += deltaX;
        this.cameras.main.scrollY += deltaY;
        this.startDragX = pointer.worldX;
        this.startDragY = pointer.worldY;
      }
    });

    // Toggle between "camera follows player" and "free camera movement"
    this.input.keyboard.on('keydown-SPACE', () => {
      this.isCameraFollowing = !this.isCameraFollowing;
      if (this.isCameraFollowing) {
        this.cameras.main.startFollow(this.player);
      } else {
        this.cameras.main.stopFollow();
      }
    });

    //####################//
    //  Player Controls   //
    //####################//

    this.cursors = this.input.keyboard.createCursorKeys(); // Keyboard controls for movement

    this.cameraSpeed = 5; // Camera movement speed
    this.playerSpeed = 0.3; // Player movement speed (in pixels per frame)

    // Enable zoom functionality (mouse wheel or keyboard)
    this.input.on('wheel', this.handleZoom, this);  // Mouse wheel zoom
    this.input.keyboard.on('keydown-EQUAL', this.zoomIn, this);  // Zoom In with "+"
    this.input.keyboard.on('keydown-MINUS', this.zoomOut, this);  // Zoom Out with "-"
  }

  handleZoom(pointer, gameObjects, deltaX, deltaY) {
    // Zoom in or out based on mouse wheel scroll
    const zoomFactor = deltaY > 0 ? 0.1 : -0.1;
    this.adjustZoom(zoomFactor);
  }

  zoomIn() {
    // Zoom in with "+" key
    this.adjustZoom(0.1);
  }

  zoomOut() {
    // Zoom out with "-" key
    this.adjustZoom(-0.1);
  }

  adjustZoom(zoomDelta) {
    // Adjust zoom level, but clamp it within reasonable limits
    this.cameraZoom = Phaser.Math.Clamp(this.cameraZoom + zoomDelta, 0.5, 2); // 0.5 is a closer zoom, 2 is a far away zoom
    this.cameras.main.setZoom(this.cameraZoom);
  }

  update() {
  // Spielerbewegung
  let moveX = 0;
  let moveY = 0;

  const cursors = this.input.keyboard.createCursorKeys(); // Cursors für Pfeiltasten

  if (cursors.left.isDown) moveX = -100;
  if (cursors.right.isDown) moveX = 100;
  if (cursors.up.isDown) moveY = -100;
  if (cursors.down.isDown) moveY = 100;

  this.player.body.setVelocity(moveX, moveY); // Geschwindigkeit setzen

  // Kamera folgt dem Spieler
  if (this.isCameraFollowing) {
    this.cameras.main.scrollX = this.player.x - this.cameras.main.width / 2;
    this.cameras.main.scrollY = this.player.y - this.cameras.main.height / 2;
  }
  }
}
