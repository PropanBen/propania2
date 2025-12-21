export function registerPlayerAnimations(scene) {
	const animations = [
		{ key: "idle_up", row: 0, startColumn: 0, endColumn: 1, frameRate: 1 },
		{ key: "idle_down", row: 2, startColumn: 0, endColumn: 1, frameRate: 1 },
		{ key: "idle_left", row: 1, startColumn: 0, endColumn: 1, frameRate: 1 },
		{ key: "idle_right", row: 3, startColumn: 0, endColumn: 1, frameRate: 1 },
		{ key: "walk_up", row: 4, startColumn: 0, endColumn: 8, frameRate: 10 },
		{ key: "walk_down", row: 6, startColumn: 0, endColumn: 8, frameRate: 10 },
		{ key: "walk_left", row: 5, startColumn: 0, endColumn: 8, frameRate: 10 },
		{ key: "walk_right", row: 7, startColumn: 0, endColumn: 8, frameRate: 10 },
		{ key: "run_up", row: 8, startColumn: 0, endColumn: 7, frameRate: 10 },
		{ key: "run_down", row: 10, startColumn: 0, endColumn: 7, frameRate: 10 },
		{ key: "run_left", row: 9, startColumn: 0, endColumn: 7, frameRate: 10 },
		{ key: "run_right", row: 11, startColumn: 0, endColumn: 7, frameRate: 10 },
		{ key: "pickup_right", row: 15, startColumn: 3, endColumn: 0, frameRate: 5, repeat: 0 },
		{ key: "pickup_left", row: 13, startColumn: 3, endColumn: 0, frameRate: 5, repeat: 0 },
		{ key: "pickup_up", row: 12, startColumn: 3, endColumn: 0, frameRate: 5, repeat: 0 },
		{ key: "pickup_down", row: 14, startColumn: 3, endColumn: 0, frameRate: 5, repeat: 0 },
		{ key: "drop_right", row: 15, startColumn: 0, endColumn: 3, frameRate: 5, repeat: 0 },
		{ key: "drop_left", row: 13, startColumn: 0, endColumn: 3, frameRate: 5, repeat: 0 },
		{ key: "drop_up", row: 12, startColumn: 0, endColumn: 3, frameRate: 5, repeat: 0 },
		{ key: "drop_down", row: 14, startColumn: 0, endColumn: 3, frameRate: 5, repeat: 0 },
		{ key: "tree_up", row: 16, startColumn: 5, endColumn: 0, frameRate: 6, repeat: 0 },
		{ key: "tree_down", row: 17, startColumn: 4, endColumn: 0, frameRate: 6, repeat: 0 },
		{ key: "tree_left", row: 18, startColumn: 4, endColumn: 0, frameRate: 6, repeat: 0 },
		{ key: "tree_right", row: 19, startColumn: 4, endColumn: 0, frameRate: 6, repeat: 0 },
		{ key: "rock_up", row: 20, startColumn: 4, endColumn: 0, frameRate: 6, repeat: 0 },
		{ key: "rock_down", row: 21, startColumn: 4, endColumn: 0, frameRate: 6, repeat: 0 },
		{ key: "rock_left", row: 22, startColumn: 4, endColumn: 0, frameRate: 6, repeat: 0 },
		{ key: "rock_right", row: 23, startColumn: 4, endColumn: 0, frameRate: 6, repeat: 0 },
		{ key: "attack_up", row: 24, startColumn: 0, endColumn: 5, frameRate: 10, repeat: 0 },
		{ key: "attack_down", row: 27, startColumn: 0, endColumn: 5, frameRate: 10, repeat: 0 },
		{ key: "attack_left", row: 26, startColumn: 0, endColumn: 5, frameRate: 10, repeat: 0 },
		{ key: "attack_right", row: 25, startColumn: 5, endColumn: 0, frameRate: 10, repeat: 0 },
	];

	animations.forEach((anim) => {
		scene.anims.create({
			key: anim.key,
			frames: scene.anims.generateFrameNumbers("player", {
				start: getFrameIndex(anim.row, anim.startColumn),
				end: getFrameIndex(anim.row, anim.endColumn),
			}),
			frameRate: anim.frameRate,
			repeat: anim.repeat ?? -1,
		});
	});

	function getFrameIndex(row, column) {
		const SPRITESHEET_COLUMNS = 10;
		return row * SPRITESHEET_COLUMNS + column;
	}
}

export function registerAnimalAnimations(scene) {
	const animations = [
		{ key: "sheep_idle_up", row: 3, startColumn: 0, endColumn: 2, frameRate: 3 },
		{ key: "sheep_idle_down", row: 0, startColumn: 1, endColumn: 2, frameRate: 3 },
		{ key: "sheep_idle_left", row: 1, startColumn: 0, endColumn: 0, frameRate: 3 },
		{ key: "sheep_idle_right", row: 2, startColumn: 2, endColumn: 2, frameRate: 3 },
		{ key: "sheep_walk_up", row: 3, startColumn: 0, endColumn: 2, frameRate: 3 },
		{ key: "sheep_walk_down", row: 0, startColumn: 0, endColumn: 2, frameRate: 3 },
		{ key: "sheep_walk_left", row: 1, startColumn: 0, endColumn: 2, frameRate: 3 },
		{ key: "sheep_walk_right", row: 2, startColumn: 0, endColumn: 2, frameRate: 3 },
		{ key: "sheep_run_up", row: 3, startColumn: 0, endColumn: 2, frameRate: 6 },
		{ key: "sheep_run_down", row: 0, startColumn: 0, endColumn: 2, frameRate: 6 },
		{ key: "sheep_run_left", row: 1, startColumn: 0, endColumn: 2, frameRate: 6 },
		{ key: "sheep_run_right", row: 2, startColumn: 0, endColumn: 2, frameRate: 6 },
		{ key: "sheep_attack_up", row: 3, startColumn: 0, endColumn: 2, frameRate: 3 },
		{ key: "sheep_attack_down", row: 3, startColumn: 0, endColumn: 2, frameRate: 3 },
		{ key: "sheep_attack_left", row: 3, startColumn: 0, endColumn: 2, frameRate: 3 },
		{ key: "sheep_attack_right", row: 3, startColumn: 0, endColumn: 2, frameRate: 3 },
		{ key: "sheep_dead", row: 4, startColumn: 0, endColumn: 2, frameRate: 1, repeat: 0 },
	];

	animations.forEach((anim) => {
		scene.anims.create({
			key: anim.key,
			frames: scene.anims.generateFrameNumbers("sheep", {
				start: getFrameIndex(anim.row, anim.startColumn),
				end: getFrameIndex(anim.row, anim.endColumn),
			}),
			frameRate: anim.frameRate,
			repeat: anim.repeat ?? -1,
		});
	});

	function getFrameIndex(row, column) {
		const SPRITESHEET_COLUMNS = 3;
		return row * SPRITESHEET_COLUMNS + column;
	}
}
