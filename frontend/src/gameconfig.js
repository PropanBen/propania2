export const gameConfig = {
	type: Phaser.AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	pixelArt: true,
	antialias: true,
	roundPixels: true,
	backgroundColor: "#319ddb",
	parent: "game-container",
	dom: {
		createContainer: true, // <-- DAS ist wichtig für DOM-Elemente
	},
	scale: {
		mode: Phaser.Scale.RESIZE, // Passt das Spiel an die Fenstergröße an
		autoCenter: Phaser.Scale.CENTER_BOTH, // Zentriert das Spiel
	},
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 0, x: 0 },
			debug: false,
		},
	},
};
