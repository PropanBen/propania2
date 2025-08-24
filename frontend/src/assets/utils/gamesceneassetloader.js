export function preloadAssets(scene) {
	const playerUrl = new URL('../players/Player_Template.png', import.meta.url)
		.href;
	scene.load.spritesheet('player', playerUrl, {
		frameWidth: 64,
		frameHeight: 64,
	});

	const mapUrl = new URL('../map/maps/map.json', import.meta.url).href;
	scene.load.tilemapTiledJSON('map', mapUrl);

	const groundUrl = new URL('../map/images/Ground.png', import.meta.url).href;
	scene.load.image('ground', groundUrl);
}
