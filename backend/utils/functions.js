export default class Functions {
	static randomFloatRange(min, max) {
		return Math.random() * (max - min) + min;
	}

	static randomIntRange(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	static getDropPosition(x, y, lastDirection) {
		const offset = { x: 0, y: 0 };
		switch (lastDirection) {
			case "up":
				offset.y = -10;
				break;
			case "down":
				offset.y = 80;
				break;
			case "left":
				offset.x = -30;
				offset.y = 50;
				break;
			case "right":
				offset.x = 30;
				offset.y = 50;
				break;
		}
		return { x: x + offset.x, y: y + offset.y };
	}
}
