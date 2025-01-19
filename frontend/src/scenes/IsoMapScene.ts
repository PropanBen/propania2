enum TILE_TYPES {
	DIRT = 0, // Erde
	STONE = 1, // Stein
	WATER = 2, // Wasser
	GRASS = 4, // Gras
}

import Phaser from 'phaser';
import type { Vector2D } from '../types/direction.enum';

export default class IsoMapScene extends Phaser.Scene {
	private readonly TILE_SIZE = 32;
	private readonly MAP_WIDTH = 100;
	private readonly MAP_HEIGHT = 100;

	private cameraZoom: number;
	private isoGroup?: Phaser.GameObjects.Group;
	private dragging?: boolean;
	private startDrag?: Vector2D;
	private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

	constructor() {
		super({ key: 'IsoMapScene' });
		this.cameraZoom = 1; // Initial zoom level (1 means no zoom)
	}

	preload() {
		this.load.spritesheet('tiles', 'assets/map/images/Ground.png', {
			frameWidth: this.TILE_SIZE,
			frameHeight: this.TILE_SIZE,
		});
	}

	create() {
		const seed = this.createSeededRandom(1234510); // Beispiel-Seed

		this.isoGroup = this.add.group();
		const map = this.generateMap(this.MAP_WIDTH, this.MAP_HEIGHT, seed);

		this.createIsometricMap(map);

		this.cameras.main.setBounds(
			0,
			0,
			this.MAP_WIDTH * this.TILE_SIZE,
			this.MAP_HEIGHT * this.TILE_SIZE
		);

		//##################//
		//      Kamera      //
		//##################//

		// Set initial zoom level of the camera
		this.cameraZoom = 2; // Zoom level (adjust as needed)
		this.cameras.main.setZoom(this.cameraZoom);

		// Mouse input for camera drag (free camera movement)
		this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
			this.dragging = true;
			this.startDrag = { x: pointer.worldX, y: pointer.worldY };
		});

		this.input.on('pointerup', () => {
			this.dragging = false;
		});

		this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
			if (this.dragging) {
				const deltaX = this.startDrag!.x - pointer.worldX;
				const deltaY = this.startDrag!.y - pointer.worldY;
				this.cameras.main.scrollX += deltaX;
				this.cameras.main.scrollY += deltaY;
				this.startDrag = { x: pointer.worldX, y: pointer.worldY };
			}
		});

		// Enable zoom functionality (mouse wheel or keyboard)
		this.input.on('wheel', this.handleZoom, this); // Mouse wheel zoom
		this.input.keyboard!.on('keydown-EQUAL', this.zoomIn, this); // Zoom In with "+"
		this.input.keyboard!.on('keydown-MINUS', this.zoomOut, this); // Zoom Out with "-"

		// Keyboard controls for camera movement (arrow keys)
		this.cursors = this.input.keyboard!.createCursorKeys(); // Keyboard controls for movement
	}

	handleZoom(
		pointer: Phaser.Input.Pointer,
		gameObjects: unknown,
		deltaX: number,
		deltaY: number
	) {
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

	adjustZoom(zoomDelta: number) {
		// Adjust zoom level, but clamp it within reasonable limits
		this.cameraZoom = Phaser.Math.Clamp(this.cameraZoom + zoomDelta, 0.5, 2); // 0.5 is a closer zoom, 2 is a far away zoom
		this.cameras.main.setZoom(this.cameraZoom);
	}

	generateMap(width: number, height: number, seed: number) {
		const map = [];

		for (let y = 0; y < height; y++) {
			const row = [];
			for (let x = 0; x < width; x++) {
				let tileType;
				if (seed < 0.7) {
					tileType = TILE_TYPES.GRASS; // 70% Gras
				} else if (seed < 0.9) {
					tileType = TILE_TYPES.DIRT; // 20% Erde
				} else if (seed < 0.95) {
					tileType = TILE_TYPES.STONE; // 5% Stein
				} else {
					tileType = TILE_TYPES.WATER; // 5% Wasser
				}

				row.push(tileType);
			}
			map.push(row);
		}

		return map;
	}

	createIsometricMap(map: (string | number)[][]) {
		const halfTileWidth = this.TILE_SIZE / 2;
		const halfTileHeight = this.TILE_SIZE / 4;

		for (let y = 0; y < map.length; y++) {
			for (let x = 0; x < map[y].length; x++) {
				const tileType = map[y][x];

				const isoX = (x - y) * halfTileWidth + this.MAP_WIDTH * halfTileWidth;
				const isoY = (x + y) * halfTileHeight;

				const tile = this.add.image(isoX, isoY, 'tiles', tileType);
				tile.setOrigin(0.5, 1); // Anpassung für isometrische Ansicht

				this.isoGroup!.add(tile);
			}
		}

		this.isoGroup!.children.iterate((child) => {
			(child as Phaser.GameObjects.Image).depth = (
				child as Phaser.GameObjects.Image
			).y; // Isometrische Tiefe basierend auf der Y-Position
			return true;
		});
	}

	update() {
		// Kamera Navigation mit Tastatur
		const speed = 5;

		if (this.cursors!.left.isDown) {
			this.cameras.main.scrollX -= speed;
		} else if (this.cursors!.right.isDown) {
			this.cameras.main.scrollX += speed;
		}

		if (this.cursors!.up.isDown) {
			this.cameras.main.scrollY -= speed;
		} else if (this.cursors!.down.isDown) {
			this.cameras.main.scrollY += speed;
		}
	}

	private createSeededRandom(seed: number): number {
		let x = Math.sin(seed) * 10000;
		x = Math.sin(x) * 10000;
		return x - Math.floor(x);
	}
}
