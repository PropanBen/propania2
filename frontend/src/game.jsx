// game.js
import Phaser from "phaser";
import { gameConfig } from "./gameconfig.js";
import PlayerSelectScene from "./scenes/playerselectscene.js";
import GameScene from "./scenes/gamescene.js";
import UIScene from "./scenes/uiscene.js";

let phaserGame = null;

export const startGame = (account_id) => {
	// existierendes Game zerstören, bevor ein neues gestartet wird
	if (phaserGame) {
		phaserGame.destroy(true);
		phaserGame = null;
	}

	// Phaser ins #game-container mounten
	const configWithData = {
		...gameConfig,
		parent: "game-container", // <--- wichtig!
		scene: [new PlayerSelectScene({ account_id }), new GameScene({ account_id }), new UIScene({ account_id })],
	};

	phaserGame = new Phaser.Game(configWithData);
	return phaserGame;
};

export const destroyGame = () => {
	if (phaserGame) {
		phaserGame.destroy(true);
		phaserGame = null;

		// optional: Container leeren
		const container = document.getElementById("game-container");
		if (container) container.innerHTML = "";
	}
};
