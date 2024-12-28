
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }


preload() {

  this.load.image('sky', 'assets/sky.png');
}

create() {

  const socket = io('http://localhost:3000'); 
  let messageText; 
  // Hintergrundbild hinzufügen
  this.add.image(400, 300, 'sky');

  this.add.text(300, 250, 'Klicke, um zu spielen!', { fontSize: '32px', fill: '#fff' })
  .setInteractive()
  .on('pointerdown', () => {
    this.scene.start('GameScene');
  });

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

update() {
  // Spiel-Logik für den Update-Loop
}
}


