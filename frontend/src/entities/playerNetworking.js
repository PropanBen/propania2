import { socket } from "../socket";

export default class PlayerNetworking {
	constructor(player) {
		this.player = player;
	}

	update() {
		if (!this.player.isLocal()) return;

		const data = {
			x: this.player.x,
			y: this.player.y,
			lastDirection: this.player.lastDirection,
			anim: this.player.animation.getCurrentAnimationKey(),
		};

		socket.emit("playerMovement", data);
	}

	destroy() {}
}
