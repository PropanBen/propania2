export function preloadAssets(scene) {
	const playerUrl = new URL("../players/Player_Template.png", import.meta.url).href;
	scene.load.spritesheet("player", playerUrl, {
		frameWidth: 64,
		frameHeight: 64,
	});

	// Map

	const mapUrl = new URL("../map/maps/map.json", import.meta.url).href;
	scene.load.tilemapTiledJSON("map", mapUrl);

	const groundUrl = new URL("../map/images/Ground.png", import.meta.url).href;
	scene.load.image("ground", groundUrl);

	// Items

	const logURL = new URL("../items/Items.png", import.meta.url).href;
	scene.load.spritesheet("items", logURL, {
		frameWidth: 32,
		frameHeight: 32,
	});

	// Resources
	const treeUrl = new URL("../resources/tree.png", import.meta.url).href;
	scene.load.image("tree", treeUrl);

	const mushroomURL = new URL("../items/mushroom.png", import.meta.url).href;
	scene.load.image("mushroom", mushroomURL, {
		frameWidth: 32,
		frameHeight: 32,
	});

	// Sounds

	const popsoundURL = new URL("../sounds/pop.mp3", import.meta.url).href;
	scene.load.audio("pop", popsoundURL);

	const dropsoundURL = new URL("../sounds/drop.mp3", import.meta.url).href;
	scene.load.audio("drop", dropsoundURL);
}
