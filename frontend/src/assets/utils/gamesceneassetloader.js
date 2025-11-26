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

	// Resources
	const RockUrl = new URL("../resources/rock.png", import.meta.url).href;
	scene.load.image("rock", RockUrl);

	const mushroomURL = new URL("../items/mushroom.png", import.meta.url).href;
	scene.load.image("mushroom", mushroomURL, {
		frameWidth: 32,
		frameHeight: 32,
	});

	//UI
	// Resources
	const arrow_downUrl = new URL("../ui/arrow_down.png", import.meta.url).href;
	scene.load.image("arrow_down", arrow_downUrl);

	// Sounds

	const popsoundURL = new URL("../sounds/pop.mp3", import.meta.url).href;
	scene.load.audio("pop", popsoundURL);

	const dropsoundURL = new URL("../sounds/drop.mp3", import.meta.url).href;
	scene.load.audio("drop", dropsoundURL);

	const cuttingtreesoundURL = new URL("../sounds/cuttingtree.mp3", import.meta.url).href;
	scene.load.audio("chop", cuttingtreesoundURL);

	const treefallURL = new URL("../sounds/treefall.mp3", import.meta.url).href;
	scene.load.audio("treefall", treefallURL);

	const treefalldownURL = new URL("../sounds/treefalldown.mp3", import.meta.url).href;
	scene.load.audio("treefalldown", treefalldownURL);

	const pickaxeURL = new URL("../sounds/pickaxe.mp3", import.meta.url).href;
	scene.load.audio("pickaxe", pickaxeURL);

	const rockbreaksURL = new URL("../sounds/rockbreaks.mp3", import.meta.url).href;
	scene.load.audio("rockbreaks", rockbreaksURL);
}
