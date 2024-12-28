// Hier kannst du direkt den globalen `io`-Namespace von Socket.IO verwenden
const socket = io('http://localhost:3000'); // Verbinde mit dem Server

// Phaser.js-Konfiguration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  scene: {
    preload: preload,
    create: create,
    update: update,
  }
};

const game = new Phaser.Game(config);

let messageText; 

function preload() {
  this.load.image('sky', 'assets/sky.png');
}

function create() {
  // Hintergrundbild hinzufügen
  this.add.image(400, 300, 'sky');

  // Initialen Text für Nachrichten anzeigen
  messageText = this.add.text(400, 50, '', {
    font: '32px Arial',
    fill: '#ffffff',
    align: 'center'
  }).setOrigin(0.5);

  // Wenn der Client eine Nachricht vom Server empfängt
  socket.on('message', (message) => {
    // Die Nachricht im Spiel anzeigen
    messageText.setText(message);  // Text im Spiel aktualisieren
  });
}

function update() {
  // Spiel-Logik für den Update-Loop
}
