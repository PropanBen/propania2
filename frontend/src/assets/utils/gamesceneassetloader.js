export function preloadAssets(scene) {
	//player
	const playerUrl = new URL("../players/Player_Template.png", import.meta.url).href;
	scene.load.spritesheet("player", playerUrl, {
		frameWidth: 64,
		frameHeight: 64,
	});

	const playerspeakboxURL = new URL("../ui/playerspeakbox.png", import.meta.url).href;
	scene.load.spritesheet("playerspeakbox", playerspeakboxURL, {
		frameWidth: 32,
		frameHeight: 32,
	});

	//NPCs

	const merchantURL = new URL("../npcs/merchant.png", import.meta.url).href;
	scene.load.spritesheet("merchant", merchantURL, {
		frameWidth: 64,
		frameHeight: 64,
	});
	const merchantcartURL = new URL("../npcs/merchantcart.png", import.meta.url).href;
	scene.load.spritesheet("merchantcart", merchantcartURL, {
		frameWidth: 500,
		frameHeight: 400,
	});

	//Animals

	// Sheep
	const sheepUrl = new URL("../animals/sheep.png", import.meta.url).href;
	scene.load.spritesheet("sheep", sheepUrl, {
		frameWidth: 32,
		frameHeight: 32,
	});

	// Map

	/*
	const mapUrl = new URL("../map/maps/map.json", import.meta.url).href;
	scene.load.tilemapTiledJSON("map", mapUrl);

	const groundUrl = new URL("../map/images/tileset_ground.png", import.meta.url).href;
	scene.load.image("ground", groundUrl); */

	const mapUrl = new URL("../map/map.json", import.meta.url).href;
	scene.load.tilemapTiledJSON("map", mapUrl);

	const groundUrl = new URL("../map/images/Gras_Spritesheet.png", import.meta.url).href;
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

	const RockUrl = new URL("../resources/rock.png", import.meta.url).href;
	scene.load.image("rock", RockUrl);

	// Buildings

	const woodhouse_standardURL = new URL("../buildings/woodhouse.png", import.meta.url).href;
	scene.load.image("woodhouse", woodhouse_standardURL);

	const woodhouse_insideURL = new URL("../buildings/woodhouse_inside.png", import.meta.url).href;
	scene.load.image("woodhouse_inside", woodhouse_insideURL);

	const woodhouse_dooropenURL = new URL("../buildings/woodhouse_dooropen.png", import.meta.url).href;
	scene.load.image("woodhouse_dooropen", woodhouse_dooropenURL);

	//UI

	const cancel_downUrl = new URL("../ui/cancel.png", import.meta.url).href;
	scene.load.image("cancel", cancel_downUrl);

	const arrow_downUrl = new URL("../ui/arrow_down.png", import.meta.url).href;
	scene.load.image("arrow_down", arrow_downUrl);

	const hpURL = new URL("../ui/hp.png", import.meta.url).href;
	scene.load.image("hp", hpURL);

	const xpURL = new URL("../ui/xp.png", import.meta.url).href;
	scene.load.image("xp", xpURL);

	const moneyURL = new URL("../ui/money.png", import.meta.url).href;
	scene.load.image("money", moneyURL);

	const lvlURL = new URL("../ui/lvl.png", import.meta.url).href;
	scene.load.image("lvl", lvlURL);

	const eURL = new URL("../ui/e.png", import.meta.url).href;
	scene.load.image("e", eURL);

	const fURL = new URL("../ui/f.png", import.meta.url).href;
	scene.load.image("f", fURL);

	const qURL = new URL("../ui/q.png", import.meta.url).href;
	scene.load.image("q", qURL);

	const plusURL = new URL("../ui/plus.png", import.meta.url).href;
	scene.load.image("plus", plusURL);

	const plusgreenURL = new URL("../ui/plus_green.png", import.meta.url).href;
	scene.load.image("plus_green", plusgreenURL);

	const minusURL = new URL("../ui/minus.png", import.meta.url).href;
	scene.load.image("minus", minusURL);

	const minusredURL = new URL("../ui/minus_red.png", import.meta.url).href;
	scene.load.image("minus_red", minusredURL);

	const camURL = new URL("../ui/cam.png", import.meta.url).href;
	scene.load.image("cam", camURL);

	const inventoryURL = new URL("../ui/inventory.png", import.meta.url).href;
	scene.load.image("inventory", inventoryURL);

	const logoutURL = new URL("../ui/logout.png", import.meta.url).href;
	scene.load.image("logout", logoutURL);

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

	const swordswingURL = new URL("../sounds/swordswing.mp3", import.meta.url).href;
	scene.load.audio("swordswing", swordswingURL);

	const sheepbleatURL = new URL("../sounds/sheepbleat.mp3", import.meta.url).href;
	scene.load.audio("sheepbleat", sheepbleatURL);

	const coinURL = new URL("../sounds/coin.mp3", import.meta.url).href;
	scene.load.audio("coin", coinURL);

	const opendoorURL = new URL("../sounds/opendoor.mp3", import.meta.url).href;
	scene.load.audio("opendoor", opendoorURL);

	const closedoorURL = new URL("../sounds/closedoor.mp3", import.meta.url).href;
	scene.load.audio("closedoor", closedoorURL);
}
