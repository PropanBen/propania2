import CameraControl from '../controls/CameraControl.js';
import InputManager from '../controls/InputManager.js';
import AnimationManager from '../animations/AnimationManager.js';
import Phaser from 'phaser';
import type { Vector2D } from '../types/direction.enum.ts';
import { Direction } from '../types/direction.enum.ts';

export default class GameScene extends Phaser.Scene {
	private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	private item?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

	private actionzoneOffset?: Vector2D;

	private spriteObjects: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] =
		[];
	private actionzone?: Phaser.GameObjects.Rectangle;
	private blueRectangle?: Phaser.GameObjects.Rectangle;

	private treeGroup?: Phaser.GameObjects.Group;

	private groundLayer?: Phaser.Tilemaps.TilemapLayer;
	private obstaclesLayer?: Phaser.Tilemaps.TilemapLayer;

	private cameraControl?: CameraControl;
	private inputManager?: InputManager;
	private animationManager?: AnimationManager;

	constructor() {
		super({ key: 'GameScene' });
	}

	preload() {
		// Assets laden
		this.load.tilemapTiledJSON('map', 'assets/map/maps/map.json');
		this.load.image('ground', 'assets/map/images/Ground.png');
		this.load.image('treeleaves', 'assets/map/images/TreeLeaves.png');
		this.load.image('trees', 'assets/map/images/TreeStump.png');
		this.load.image('stone', 'assets/map/images/stone.png');
		this.load.image('item', 'assets/images/pickaxe2.png');
		this.load.image({
			key: 'tree',
			url: 'assets/images/Tree_isometric.png',
			frameConfig: {
				frameWidth: 360,
				frameHeight: 360,
			},
		});
		this.load.spritesheet({
			key: 'player',
			url: 'assets/players/Player_Template.png',
			frameConfig: {
				frameWidth: 64,
				frameHeight: 64,
			},
		});
	}

	create() {
		// Spieler erstellen
		this.player = this.physics.add
			// -200 = ?, 900 = ?, 'player' = frameKey, 26 = idleIndex
			.sprite(-200, 900, 'player', 26)
			.setOrigin(0.5, 0.5)
			.setScale(0.5);

		this.physics.world.enable(this.player);
		this.player.body.setSize(16, 16);
		this.player.setDepth(10);
		this.scene.launch('UIScene');
		this.spriteObjects.push(this.player);
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
		//this.actionzone?.body?.setImmovable(true); // Kann nicht von anderen Objekten verschoben werden
		this.actionzone.setDepth(11);
		this.spriteObjects.push(this.player!);

		this.blueRectangle = this.add.rectangle(-150, 900, 20, 20, 0x0000ff, 0.5);
		this.physics.add.existing(this.blueRectangle, true);
		// this.blueRectangle.body.setImmovable(true);
		this.blueRectangle.setDepth(10);

		this.physics.add.collider(this.player, this.blueRectangle);

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
			this.spriteObjects.push(tree);
			this.treeGroup.add(tree);
		}

		// Karte erstellen
		const map = this.make.tilemap({ key: 'map' });
		const groundTiles = map.addTilesetImage('Ground', 'ground');
		const treeLeavesTiles = map.addTilesetImage('TreeLeaves', 'treeleaves');
		const treesTiles = map.addTilesetImage('Trees', 'trees');

		this.groundLayer = map.createLayer('Ground', groundTiles!, 0, 0)!;
		this.obstaclesLayer = map.createLayer(
			'Obstacles',
			[treeLeavesTiles!, treesTiles!],
			0,
			0
		)!;
		this.obstaclesLayer.setCollisionByExclusion([-1]);
		this.physics.add.collider(this.player, this.obstaclesLayer);

		// Kollisionserkennung für Zone
		this.physics.add.collider(this.actionzone, this.blueRectangle);
		this.physics.add.overlap(
			this.actionzone,
			this.treeGroup,
			this.handleActionzoneCollision,
			undefined,
			this
		);
		this.physics.add.collider(
			this.player,
			this.treeGroup,
			undefined,
			undefined,
			this
		);

		// Kollisionserkennung für Actionzone und Baum
		this.physics.add.overlap(
			this.actionzone,
			this.treeGroup,
			this.handleActionzoneCollision,
			undefined,
			this
		);

		// Überwachung der Kollisionen, um den Alpha-Wert zurückzusetzen, wenn der Spieler nicht mehr überlappt
		this.physics.world.on('worldstep', () => {
			this.treeGroup!.getChildren().forEach((tree) => {
				if (
					!this.isPlayerOverlappingTree(
						tree as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
					)
				) {
					(tree as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setAlpha(
						1
					); // Baum wird wieder sichtbar, wenn der Spieler nicht mehr überlappt
				}
			});
		});

		// Input Manager und Kamera-Steuerung
		this.cameraControl = new CameraControl(this, this.player);
		this.inputManager = new InputManager(this, this.player, this.cameraControl);

		// Animationen
		this.animationManager = new AnimationManager(this, this.player);
	}

	update() {
		// Spielerbewegung
		const velocity = this.inputManager!.handlePlayerMovement();
		const direction: Direction = this.inputManager!.getDirection(); // Verwende getDirection aus InputManager
		this.animationManager!.playAnimation(direction, velocity);

		// Kamera aktualisieren
		this.cameraControl!.update();

		// Spielerdaten an UIScene senden
		this.scene
			.get('UIScene')
			.events.emit('updatePlayerPosition', this.player!.x, this.player!.y);

		// Actionzone mit dem Spieler bewegen
		this.actionzone!.setPosition(
			this.player!.x + this.actionzoneOffset!.x,
			this.player!.y + this.actionzoneOffset!.y - 15
		);

		this.setActionzoneDirection(this.actionzone!, direction);

		// Sortiere alle Objekte basierend auf ihrer Y-Position
		this.spriteObjects.sort((a, b) => a.y - b.y);

		// Aktualisiere die Tiefenwerte basierend auf der Sortierung
		this.spriteObjects.forEach((obj, index) => {
			obj.setDepth(index);
		});
	}

	setActionzoneDirection(
		actionzone: Phaser.GameObjects.Rectangle,
		direction: Direction
	): void {
		const offsets: {
			left: Vector2D;
			right: Vector2D;
			up: Vector2D;
			down: Vector2D;
		} = {
			left: { x: -10, y: 10 },
			right: { x: 10, y: 10 },
			up: { x: 0, y: 0 },
			down: { x: 0, y: 20 },
		};
		if (!!offsets[direction]) {
			this.actionzoneOffset = offsets[direction];
		}

		direction === Direction.UP
			? actionzone.setDepth(8)
			: actionzone.setDepth(11);
	}

	// Diese Methode wird aufgerufen, wenn die Actionzone mit einem Baum kollidiert
	handleActionzoneCollision(
		zone:
			| Phaser.Types.Physics.Arcade.GameObjectWithBody
			| Phaser.Physics.Arcade.Body
			| Phaser.Tilemaps.Tile,
		tree:
			| Phaser.Types.Physics.Arcade.GameObjectWithBody
			| Phaser.Physics.Arcade.Body
			| Phaser.Tilemaps.Tile
	): void {
		console.log('Zone hat einen Baum berührt!');
		(tree as Phaser.Tilemaps.Tile).setAlpha(0.5); // Setzt den Baum transparent, wenn er berührt wird
	}

	// Überprüft, ob der Spieler mit einem Baum überlappt
	isPlayerOverlappingTree(
		tree: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
	): boolean {
		// Verwende die Bounding-Box des Spielers und des Baumes
		const playerBounds = new Phaser.Geom.Rectangle(
			this.player!.x - this.player!.width / 2,
			this.player!.y - this.player!.height / 2,
			this.player!.width,
			this.player!.height
		);
		const treeBounds = tree.getBounds();

		return Phaser.Geom.Intersects.RectangleToRectangle(
			playerBounds,
			treeBounds
		);
	}
}
