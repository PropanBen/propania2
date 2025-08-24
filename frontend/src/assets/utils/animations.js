export function registerPlayerAnimations(scene) {
	const animations = [
		{ key: 'idle_up', row: 22, startColumn: 0, endColumn: 1, frameRate: 1 },
		{ key: 'idle_down', row: 24, startColumn: 0, endColumn: 1, frameRate: 1 },
		{ key: 'idle_left', row: 23, startColumn: 0, endColumn: 1, frameRate: 1 },
		{
			key: 'idle_right',
			row: 25,
			startColumn: 0,
			endColumn: 1,
			frameRate: 1,
		},
		{ key: 'walk_up', row: 8, startColumn: 0, endColumn: 8, frameRate: 10 },
		{
			key: 'walk_down',
			row: 10,
			startColumn: 0,
			endColumn: 8,
			frameRate: 10,
		},
		{ key: 'walk_left', row: 9, startColumn: 0, endColumn: 8, frameRate: 10 },
		{
			key: 'walk_right',
			row: 11,
			startColumn: 0,
			endColumn: 8,
			frameRate: 10,
		},
		{ key: 'run_up', row: 38, startColumn: 0, endColumn: 7, frameRate: 10 },
		{ key: 'run_down', row: 40, startColumn: 0, endColumn: 7, frameRate: 10 },
		{ key: 'run_left', row: 39, startColumn: 0, endColumn: 7, frameRate: 10 },
		{
			key: 'run_right',
			row: 41,
			startColumn: 0,
			endColumn: 7,
			frameRate: 10,
		},
		{
			key: 'pickup_right',
			row: 15,
			startColumn: 3,
			endColumn: 0,
			frameRate: 5,
			repeat: 0,
		},
		{
			key: 'pickup_left',
			row: 13,
			startColumn: 3,
			endColumn: 0,
			frameRate: 5,
			repeat: 0,
		},
		{
			key: 'pickup_up',
			row: 12,
			startColumn: 3,
			endColumn: 0,
			frameRate: 5,
			repeat: 0,
		},
		{
			key: 'pickup_down',
			row: 14,
			startColumn: 3,
			endColumn: 0,
			frameRate: 5,
			repeat: 0,
		},
		{
			key: 'treecut_up',
			row: 54,
			startColumn: 5,
			endColumn: 0,
			frameRate: 6,
			repeat: 0,
		},
		{
			key: 'treecut_down',
			row: 55,
			startColumn: 4,
			endColumn: 0,
			frameRate: 6,
			repeat: 0,
		},
		{
			key: 'treecut_left',
			row: 56,
			startColumn: 4,
			endColumn: 0,
			frameRate: 6,
			repeat: 0,
		},
		{
			key: 'treecut_right',
			row: 57,
			startColumn: 4,
			endColumn: 0,
			frameRate: 6,
			repeat: 0,
		},
	];

	animations.forEach((anim) => {
		scene.anims.create({
			key: anim.key,
			frames: scene.anims.generateFrameNumbers('player', {
				start: getFrameIndex(anim.row, anim.startColumn),
				end: getFrameIndex(anim.row, anim.endColumn),
			}),
			frameRate: anim.frameRate,
			repeat: anim.repeat ?? -1,
		});
		//scene.animationKeys.push(anim.key);
	});
}

// Berechnet den Frame-Index anhand der Zeile und Spalte im Spritesheet
function getFrameIndex(row, column) {
	const SPRITESHEET_COLUMNS = 13; // Anzahl der Spalten im Spritesheet
	return row * SPRITESHEET_COLUMNS + column;
}
