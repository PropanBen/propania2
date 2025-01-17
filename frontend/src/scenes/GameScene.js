import CameraControl from '../controls/CameraControl.js';
import InputManager from '../controls/InputManager.js';
import AnimationManager from '../animations/AnimationManager.js';
import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: 'GameScene' });
		this.player = null;
		this.cameraControl = null;
		this.inputManager = null;
		this.animationManager = null;
		this.actionzoneOffset = null;
		this.blueRectangle = null;
		this.item = null;
		this.objects = [];
		this.treeGroup = null;
	}

	preload() {
		// Assets laden
		this.load.tilemapTiledJSON('map', 'assets/map/maps/map.json');
		this.load.image('ground', 'assets/map/images/Ground.png');
		this.load.image('treeleaves', 'assets/map/images/TreeLeaves.png');
		this.load.image('trees', 'assets/map/images/TreeStump.png');
		this.load.image('stone', 'assets/map/images/stone.png');
		this.load.image('item', 'assets/images/pickaxe2.png');
		this.load.image('tree', 'assets/images/Tree_isometric.png', {
			frameWidth: 360,
			frameHeight: 360,
		});
		this.load.spritesheet('player', 'assets/players/Player_Template.png', {
			frameWidth: 64,
			frameHeight: 64,
		});
	}

	create() {
		// Spieler erstellen
		const idleIndex = 26; // Beispiel: Idle-Frame
		this.player = this.physics.add
			.sprite(-200, 900, 'player', idleIndex)
			.setOrigin(0.5, 0.5)
			.setScale(0.5);
		this.physics.world.enable(this.player);
		this.player.body.setSize(16, 16);
		this.player.setDepth(10);
		this.scene.launch('UIScene');
		this.objects.push(this.player);
		this.player.setOrigin(0.5, 1);

		// Actionzone erstellen
		this.actionzoneOffset = { x: 10, y: 10 }; // Offset für die actionzone relativ zum Spieler
		this.actionzone = this.add.rectangle(
			this.player.x + this.actionzoneOffset.x,
			this.player.y + this.actionzoneOffset.y,
			10,
			10,
			0xff0000,
			0.5
		);
		this.physics.add.existing(this.actionzone, false); // **Dynamisch statt statisch**
		this.actionzone.body.setImmovable(true); // Kann nicht von anderen Objekten verschoben werden
		this.actionzone.setDepth(11);
		this.objects.push(this.player);

		this.blueRectangle = this.add.rectangle(-150, 900, 20, 20, 0x0000ff, 0.5);
		this.physics.add.existing(this.blueRectangle);
		this.blueRectangle.body.setImmovable(true);
		this.blueRectangle.setDepth(10);

		this.item = this.physics.add
			.sprite(-48, 952, 'item')
			.setOrigin(0.5, 0.5)
			.setScale(0.5);
		this.physics.world.enable(this.item);
		this.item.body.setSize(32, 32);
		this.item.setDepth(9);

		//Groups
		this.treeGroup = this.add.group();

		// Füge mehrere Bäume an zufälligen Positionen hinzu
		for (let i = 0; i < 10; i++) {
			const x = Phaser.Math.Between(0, 200);
			const y = Phaser.Math.Between(700, 1000);
			const tree = this.physics.add
				.sprite(x, y, 'tree')
				.setDepth(9)
				.setScale(0.5);
			// Passe die Kollisionsbox an den Baumstumpf an
			const stumpHeight = 20; // Höhe des Baumstumpfs (anpassen je nach Sprite)
			const stumpWidth = tree.width * 0.15; // Breite des Baumstumpfs (anpassen)
			tree.setSize(stumpWidth, stumpHeight); // Kollisionsbox verkleinern
			tree.setOffset(
				(tree.width - stumpWidth) / 2,
				tree.height - stumpHeight - 30
			);
			tree.setOrigin(0.5, 0.9);
			tree.setImmovable(true);
			this.objects.push(tree);
			this.treeGroup.add(tree);
		}

		// Karte erstellen
		const map = this.make.tilemap({ key: 'map' });
		const groundTiles = map.addTilesetImage('Ground', 'ground');
		const treeLeavesTiles = map.addTilesetImage('TreeLeaves', 'treeleaves');
		const treesTiles = map.addTilesetImage('Trees', 'trees');

		this.groundLayer = map.createLayer('Ground', groundTiles, 0, 0);
		this.obstaclesLayer = map.createLayer(
			'Obstacles',
			[treeLeavesTiles, treesTiles],
			0,
			0
		);
		this.obstaclesLayer.setCollisionByExclusion([-1]);
		this.physics.add.collider(this.player, this.obstaclesLayer);

		// Kollisionserkennung für Zone
		this.physics.add.collider(this.actionzone, this.blueRectangle);
		this.physics.add.overlap(
			this.actionzone,
			this.treeGroup,
			this.handleactionzoneCollision,
			null,
			this
		);
		this.physics.add.collider(this.player, this.treeGroup, null, null, this);

		// Kollisionserkennung für Actionzone und Baum
		this.physics.add.overlap(
			this.actionzone,
			this.treeGroup,
			this.handleActionzoneCollision,
			null,
			this
		);

		// Überwachung der Kollisionen, um den Alpha-Wert zurückzusetzen, wenn der Spieler nicht mehr überlappt
		this.physics.world.on('worldstep', () => {
			this.treeGroup.getChildren().forEach((tree) => {
				if (!this.isPlayerOverlappingTree(tree)) {
					tree.setAlpha(1); // Baum wird wieder sichtbar, wenn der Spieler nicht mehr überlappt
				}
			});
		});

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
		this.scene
			.get('UIScene')
			.events.emit('updatePlayerPosition', this.player.x, this.player.y);

		// Actionzone mit dem Spieler bewegen
		this.actionzone.setPosition(
			this.player.x + this.actionzoneOffset.x,
			this.player.y + this.actionzoneOffset.y - 15
		);

		this.setactionzoneDirection(
			this.actionzone,
			this.actionzoneOffset,
			direction
		);

		// Sortiere alle Objekte basierend auf ihrer Y-Position
		this.objects.sort((a, b) => a.y - b.y);

		// Aktualisiere die Tiefenwerte basierend auf der Sortierung
		this.objects.forEach((obj, index) => {
			obj.setDepth(index);
		});
	}

	setactionzoneDirection(actionzone, actionzoneOffset, direction) {
		const offsets = {
			left: { x: -10, y: 10 },
			right: { x: 10, y: 10 },
			up: { x: 0, y: 0 },
			down: { x: 0, y: 20 },
		};

		if (offsets[direction]) {
			actionzoneOffset.x = offsets[direction].x;
			actionzoneOffset.y = offsets[direction].y;
		}

		direction === 'up' ? actionzone.setDepth(8) : actionzone.setDepth(11);
	}
	// Diese Methode wird aufgerufen, wenn die Actionzone mit einem Baum kollidiert
	handleActionzoneCollision(zone, tree) {
		console.log('Zone hat einen Baum berührt!');
		tree.setAlpha(0.5); // Setzt den Baum transparent, wenn er berührt wird
	}

	// Überprüft, ob der Spieler mit einem Baum überlappt
	isPlayerOverlappingTree(tree) {
		// Verwende die Bounding-Box des Spielers und des Baumes
		const playerBounds = new Phaser.Geom.Rectangle(
			this.player.x - this.player.width / 2,
			this.player.y - this.player.height / 2,
			this.player.width,
			this.player.height
		);
		const treeBounds = tree.getBounds();

		return Phaser.Geom.Intersects.RectangleToRectangle(
			playerBounds,
			treeBounds
		);
	}
}
