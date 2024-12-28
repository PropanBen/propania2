
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    // Lade hier die Menügrafiken oder UI-Elemente
  }

  create() {
    this.add.text(300, 250, 'Klicke, um zu spielen!', { fontSize: '32px', fill: '#fff' })
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('GameScene');
      });
  }
}
