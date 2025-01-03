import MenuScene from './scenes/MenuScene.js';  
import GameScene from './scenes/GameScene.js'; 
import UIScene from './scenes/UIScene.js';
import IsoMapScene from './scenes/IsoMapScene.js'; 

// Hier kannst du direkt den globalen `io`-Namespace von Socket.IO verwenden
const socket = io('http://localhost:3000'); // Verbinde mit dem Server

// Phaser.js-Konfiguration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  scene: [MenuScene, GameScene, UIScene, IsoMapScene],
  physics: {
    default: 'arcade',  // Arcade Physics aktivieren
    arcade: {
      gravity: { y: 0 },  // Keine Schwerkraft, falls nicht benötigt
      debug: false  // Optional: Falls du Kollisionen debuggen möchtest, kannst du 
    }}
};

const game = new Phaser.Game(config);

