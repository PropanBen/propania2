// game.js
import Phaser from "phaser";
import { gameConfig } from "./gameconfig.js";
import PlayerSelectScene from "./scenes/playerselectscene.js";
import GameScene from "./scenes/gamescene.js";
import UIScene from "./scenes/uiscene.js";

let phaserGame = null;

export const startGame = (account_id, onLogout) => {
	if (phaserGame) {
		phaserGame.destroy(true);
		phaserGame = null;
	}

	const configWithData = {
		...gameConfig,
		parent: "game-container",
		scene: [
			new PlayerSelectScene({ account_id, onLogout }),
			new GameScene({ account_id }),
			new UIScene({ account_id, onLogout }), // <-- hier weitergeben
		],
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
