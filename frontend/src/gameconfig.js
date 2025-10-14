import GameScene from "./scenes/gamescene.js";
import SelectPlayerScene from "./scenes/playerselectscene.js";

export const gameConfig = {
	type: Phaser.AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	pixelArt: true,
	backgroundColor: "#222222",
	parent: "game-container",
	scale: {
		mode: Phaser.Scale.RESIZE, // Passt das Spiel an die Fenstergröße an
		autoCenter: Phaser.Scale.CENTER_BOTH, // Zentriert das Spiel
	},
	scene: [SelectPlayerScene, GameScene],
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 0, x: 0 },
			debug: false,
		},
	},
};
