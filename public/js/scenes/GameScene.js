import SocketManager from '../SocketManager';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player = null;
    this.tiles = [];
  }

  preload() {
    // Lade die Isometrischen Tiles
    this.load.image('grass', 'assets/images/grass.png');
    this.load.image('stone', 'assets/images/stone.png');
  }

  create() {
    this.createMap();
    this.player = this.add.sprite(100, 100, 'grass').setOrigin(0.5, 0.5);

    // Multiplayer Event
    SocketManager.onPlayerMoved((data) => {
      // Andere Spielerbewegungen anzeigen
      if (data.id !== this.player.id) {
        const playerSprite = this.add.sprite(data.x, data.y, 'grass');
        playerSprite.setOrigin(0.5, 0.5);
      }
    });

    this.input.on('pointermove', (pointer) => {
      this.movePlayer(pointer.x, pointer.y);
    });
  }

  createMap() {
    // Erstelle eine einfache Karte mit Gras- und Stein-Tiles
    for (let y = 0; y < 20; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < 20; x++) {
        const tile = this.add.sprite(x * 32, y * 32, (x + y) % 2 === 0 ? 'grass' : 'stone');
        this.tiles[y].push(tile);
      }
    }
  }

  movePlayer(x, y) {
    this.player.setPosition(x, y);
    SocketManager.sendPlayerMove({ id: this.player.id, x, y });
  }
}
