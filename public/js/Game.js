import MenuScene from './scenes/MenuScene.js';  
import GameScene from './scenes/GameScene.js'; 

// Hier kannst du direkt den globalen `io`-Namespace von Socket.IO verwenden
const socket = io('http://localhost:3000'); // Verbinde mit dem Server

// Phaser.js-Konfiguration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  scene: [MenuScene, GameScene],
 
};

const game = new Phaser.Game(config);

