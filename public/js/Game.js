import MenuScene from './scenes/MenuScene.js';  
import GameScene from './scenes/GameScene.js'; 
import UIScene from './scenes/UIScene.js';
import IsoMapScene from './scenes/IsoMapScene.js'; 

// Hier kannst du direkt den globalen `io`-Namespace von Socket.IO verwenden
const socket = io('http://localhost:3001'); // Verbinde mit dem Server

// Phaser.js-Konfiguration
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT, // Passt das Spiel in den verfügbaren Platz ein
    autoCenter: Phaser.Scale.CENTER_BOTH, // Zentriert das Spiel
},
  scene: [MenuScene, GameScene, UIScene, IsoMapScene],
  physics: {
    default: 'arcade',  // Arcade Physics aktivieren
    arcade: {
      gravity: { y: 0 },  // Keine Schwerkraft, falls nicht benötigt
      debug: false  // Optional: Falls du Kollisionen debuggen möchtest, kannst du 
    }}
};

const game = new Phaser.Game(config);

