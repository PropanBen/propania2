// src/entities/PlayerAnimationController.js

export default class PlayerAnimationController {
	constructor(scene, player) {
		this.scene = scene;
		this.player = player;
		this.currentAnim = null;
	}

	update() {
		// Wenn Aktion läuft, nicht in die Standard-Animation-Logik einsteigen
		if (this.player.state === "action") return;

		const animKey = this.getAnimationKey();
		if (animKey && animKey !== this.currentAnim) {
			this.player.play(animKey, true); // <-- hier direkt auf player
			this.currentAnim = animKey;
		}
	}

	getCurrentAnimationKey() {
		return this.currentAnim;
	}

	getAnimationKey() {
		const direction = this.player.lastDirection;
		switch (this.player.state) {
			case "idle":
				return `idle_${direction}`;
			case "walk":
				return `walk_${direction}`;
			case "run":
				return `run_${direction}`;
			default:
				return null;
		}
	}

	playAnimation(key) {
		if (!key) return;
		if (this.player.anims.currentAnim?.key !== key) {
			this.player.play(key, true); // <-- hier direkt auf player
			this.currentAnim = key;
		}
	}

	playActionAnimation(type, duration) {
		// Wenn bereits in Aktion, nichts tun
		if (this.player.state === "action") return;

		this.player.state = "action";
		const direction = this.player.lastDirection;
		const animKey = `${type}_${direction}`;

		this.player.setVelocity(0, 0);
		this.player.play(animKey, true);
		this.currentAnim = animKey;

		// Nach Ende nur zurücksetzen, falls der Player noch im action-State ist.
		this.scene.time.delayedCall(duration, () => {
			if (this.player.state === "action") {
				this.player.state = "idle";
				const idle = `idle_${direction}`;
				this.player.play(idle, true);
				this.currentAnim = idle;
			}
		});
	}
}
