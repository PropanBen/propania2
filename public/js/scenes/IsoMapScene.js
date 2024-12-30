const TILE_SIZE = 32;
const MAP_WIDTH = 100; // Anzahl der Kacheln horizontal
const MAP_HEIGHT = 100; // Anzahl der Kacheln vertikal

const TILE_TYPES = {
    DIRT: 0, // Erde
    STONE: 1, // Stein
    WATER: 2, // Wasser
    GRASS: 4, // Gras
};

function createSeededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return function () {
        x = Math.sin(x) * 10000;
        return x - Math.floor(x);
    };
}

export default class IsoMapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'IsoMapScene' });
        this.cameraZoom = 1;  // Initial zoom level (1 means no zoom)
    }

    preload() {
        this.load.spritesheet('tiles', 'assets/map/images/Ground.png', {
            frameWidth: TILE_SIZE,
            frameHeight: TILE_SIZE,
        });
    }

    create() {
        const seed = 1234510; // Beispiel-Seed
        const random = createSeededRandom(seed);

        this.isoGroup = this.add.group();
        const map = this.generateMap(MAP_WIDTH, MAP_HEIGHT, random);

        this.createIsometricMap(map);

        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

        //##################//
        //      Kamera      //
        //##################//

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
            if (this.dragging) {
                const deltaX = this.startDragX - pointer.worldX;
                const deltaY = this.startDragY - pointer.worldY;
                this.cameras.main.scrollX += deltaX;
                this.cameras.main.scrollY += deltaY;
                this.startDragX = pointer.worldX;
                this.startDragY = pointer.worldY;
            }
        });

        // Enable zoom functionality (mouse wheel or keyboard)
        this.input.on('wheel', this.handleZoom, this);  // Mouse wheel zoom
        this.input.keyboard.on('keydown-EQUAL', this.zoomIn, this);  // Zoom In with "+"
        this.input.keyboard.on('keydown-MINUS', this.zoomOut, this);  // Zoom Out with "-"
        
        // Keyboard controls for camera movement (arrow keys)
        this.cursors = this.input.keyboard.createCursorKeys(); // Keyboard controls for movement
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

    generateMap(width, height, random) {
        const map = [];

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const rand = random();

                let tileType;
                if (rand < 0.7) {
                    tileType = TILE_TYPES.GRASS; // 70% Gras
                } else if (rand < 0.9) {
                    tileType = TILE_TYPES.DIRT; // 20% Erde
                } else if (rand < 0.95) {
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

    createIsometricMap(map) {
        const halfTileWidth = TILE_SIZE / 2;
        const halfTileHeight = TILE_SIZE / 4;

        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                const tileType = map[y][x];

                const isoX = (x - y) * halfTileWidth + MAP_WIDTH * halfTileWidth;
                const isoY = (x + y) * halfTileHeight;

                const tile = this.add.image(isoX, isoY, 'tiles', tileType);
                tile.setOrigin(0.5, 1); // Anpassung für isometrische Ansicht

                this.isoGroup.add(tile);
            }
        }

        this.isoGroup.children.iterate((child) => {
            child.depth = child.y; // Isometrische Tiefe basierend auf der Y-Position
        });
    }

    update() {
        // Kamera Navigation mit Tastatur
        const speed = 5;
        
        if (this.cursors.left.isDown) {
            this.cameras.main.scrollX -= speed;
        } else if (this.cursors.right.isDown) {
            this.cameras.main.scrollX += speed;
        }

        if (this.cursors.up.isDown) {
            this.cameras.main.scrollY -= speed;
        } else if (this.cursors.down.isDown) {
            this.cameras.main.scrollY += speed;
        }
    }
}
