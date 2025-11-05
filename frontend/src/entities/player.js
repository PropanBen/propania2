import { socket } from "../socket";

export default class Player extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, playerInfo, isLocalPlayer) {
		super(scene, playerInfo.x, playerInfo.y, "player");

		this.scene = scene;
		this.socket_id = playerInfo.socket_id;
		this.player_id = playerInfo.id;
		this.name = playerInfo.name;
		this.money = playerInfo.money;
		this.exp = playerInfo.exp;
		this.level = playerInfo.level;
		this.isLocalPlayer = isLocalPlayer;
		this.x = playerInfo.x;
		this.y = playerInfo.y;
		this.actionzoneTarget = null;

		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.body.setSize(16, 16);
		this.body.setOffset(24, 48);
		this.setDepth(15);

		//this.setCollideWorldBounds(true);
		this.setScale(2);

		this.speed = 200;
		this.runSpeed = 350;
		this.currentAnim = playerInfo.anim || "idle_down";
		this.lastDirection = "down";
		this.state = "idle";

		this.actionzoneOffset = { x: 10, y: 10 };
		this.actionzone = this.scene.add.rectangle(this.x + this.actionzoneOffset.x, this.y + this.actionzoneOffset.y, 32, 32, 0xffffff, 0.5);
		this.actionzone.setAlpha(0);

		this.scene.physics.add.existing(this.actionzone, false);
		this.actionzone.setDepth(11);

		this.nameText = scene.add
			.text(this.x, this.y - 40, this.name, {
				fontSize: "14px",
				color: "#fff",
			})
			.setOrigin(0.5);

		if (isLocalPlayer) {
			// 👇 WASD Steuerung statt Pfeiltasten
			this.keys = scene.input.keyboard.addKeys({
				up: Phaser.Input.Keyboard.KeyCodes.W,
				down: Phaser.Input.Keyboard.KeyCodes.S,
				left: Phaser.Input.Keyboard.KeyCodes.A,
				right: Phaser.Input.Keyboard.KeyCodes.D,
				shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
			});

			// Kamera-Setup
			this.camera = scene.cameras.main;
			this.camera.startFollow(this);

			// Kamera Input Controls
			this.keyPlus = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS);
			this.keyMinus = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS);
			this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

			// Für Kamera-Freibewegung
			this.freeCameraMode = false;
			this.dragging = false;

			// Maus-Drag für Kamera
			scene.input.on("pointerdown", (pointer) => {
				if (this.freeCameraMode && pointer.rightButtonDown() === false) {
					this.dragging = true;
					this.dragX = pointer.x;
					this.dragY = pointer.y;
				}
			});
			scene.input.on("pointerup", () => {
				this.dragging = false;
			});
			scene.input.on("pointermove", (pointer) => {
				if (this.freeCameraMode && this.dragging) {
					const dx = this.dragX - pointer.x;
					const dy = this.dragY - pointer.y;
					this.camera.scrollX += dx / this.camera.zoom;
					this.camera.scrollY += dy / this.camera.zoom;
					this.dragX = pointer.x;
					this.dragY = pointer.y;
				}
			});

			// Mausrad Zoom
			scene.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
				if (deltaY > 0) {
					this.camera.zoom = Phaser.Math.Clamp(this.camera.zoom - 0.1, 0.5, 3);
				} else if (deltaY < 0) {
					this.camera.zoom = Phaser.Math.Clamp(this.camera.zoom + 0.1, 0.5, 3);
				}
			});
		}
	}

	setPosition(x, y) {
		super.setPosition(x, y);
		if (this.nameText) {
			this.nameText.setPosition(this.x, this.y - 40);
		}
		return this;
	}

	setDropPostion(direction) {
		let position = { x: this.x, y: this.y };
		const offset = 50;
		switch (direction) {
			case "up":
				position.y -= offset - 40;
				break;
			case "down":
				position.y += offset + 20;
				break;
			case "left":
				position.x -= offset;
				position.y += 40;
				break;
			case "right":
				position.x += offset;
				position.y += 40;
				break;
			default:
				break;
		}
		return position;
	}

	destroy(fromScene) {
		if (this.nameText) {
			this.nameText.destroy();
			this.nameText = null;
		}
		super.destroy(fromScene);
	}

	update() {
		if (!this.scene || !this.scene.sys || !this.scene.sys.isActive()) {
			return; // Szene ist schon zerstört -> nichts mehr machen
		}

		this.actionzone.setPosition(this.x + this.actionzoneOffset.x, this.y + this.actionzoneOffset.y - 15);
		this.setActionzoneDirection(this.actionzone, this.lastDirection);

		if (this.isLocalPlayer) {
			// Kamera-Update
			this.updateCameraControls();

			// Spielerbewegung
			if (this.state !== "action" && !this.freeCameraMode) {
				this.handleMovement();
			}
		}
		if (this.nameText) {
			this.nameText.setPosition(this.x, this.y - 40);
		}

		this.scene.socket.emit("playerMovement", {
			socket_id: this.socket_id,
			x: this.x,
			y: this.y,
			anim: this.currentAnim,
		});
	}

	handleMovement() {
		let vx = 0;
		let vy = 0;
		let anim = null;

		const isRunning = this.keys.shift.isDown;
		const currentSpeed = isRunning ? this.runSpeed : this.speed;

		if (this.keys.left.isDown) {
			vx = -currentSpeed;
			anim = isRunning ? "run_left" : "walk_left";
			this.lastDirection = "left";
		} else if (this.keys.right.isDown) {
			vx = currentSpeed;
			anim = isRunning ? "run_right" : "walk_right";
			this.lastDirection = "right";
		}
		if (this.keys.up.isDown) {
			vy = -currentSpeed;
			anim = isRunning ? "run_up" : "walk_up";
			this.lastDirection = "up";
		} else if (this.keys.down.isDown) {
			vy = currentSpeed;
			anim = isRunning ? "run_down" : "walk_down";
			this.lastDirection = "down";
		}

		this.setVelocity(vx, vy);

		if (vx === 0 && vy === 0) {
			anim = `idle_${this.lastDirection}`;
			this.state = "idle";
		} else {
			this.state = isRunning ? "run" : "walk";
		}

		if (anim && anim !== this.currentAnim) {
			this.play(anim, true);
			this.currentAnim = anim;
		}
	}

	playActionAnimation(animKey, duration = 500) {
		this.state = "action";
		this.setVelocity(0, 0);

		const fullAnimKey = animKey + "_" + this.lastDirection;
		this.play(fullAnimKey, true);
		this.currentAnim = fullAnimKey; // wichtig!

		this.scene.time.delayedCall(duration, () => {
			if (this.state === "action") {
				this.state = "idle";
				const idleAnim = `idle_${this.lastDirection}`;
				this.play(idleAnim, true);
				this.currentAnim = idleAnim;
			}
		});
	}

	setActionzoneDirection(actionzone, direction) {
		const offsets = {
			left: { x: -32, y: 64 },
			right: { x: 32, y: 64 },
			up: { x: 0, y: 24 },
			down: { x: 0, y: 96 },
		};

		if (offsets[direction]) {
			this.actionzoneOffset = offsets[direction];
		}

		actionzone.setDepth(direction === "up" ? 8 : 11);
	}

	updateCameraControls() {
		// Kamera-Freigabe wenn Leertaste gedrückt
		if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
			this.freeCameraMode = !this.freeCameraMode;
			if (this.freeCameraMode) {
				this.camera.stopFollow();
			} else {
				this.camera.startFollow(this);
			}
		}

		// Steuerung im Free Camera Mode
		if (this.freeCameraMode) {
			const moveSpeed = 10 / this.camera.zoom;

			if (this.keys.left.isDown) {
				this.camera.scrollX -= moveSpeed;
			} else if (this.keys.right.isDown) {
				this.camera.scrollX += moveSpeed;
			}
			if (this.keys.up.isDown) {
				this.camera.scrollY -= moveSpeed;
			} else if (this.keys.down.isDown) {
				this.camera.scrollY += moveSpeed;
			}
		}

		// Zoom via Keyboard
		if (Phaser.Input.Keyboard.JustDown(this.keyPlus)) {
			this.camera.zoom = Phaser.Math.Clamp(this.camera.zoom + 0.1, 0.5, 3);
		}
		if (Phaser.Input.Keyboard.JustDown(this.keyMinus)) {
			this.camera.zoom = Phaser.Math.Clamp(this.camera.zoom - 0.1, 0.5, 3);
		}
	}
}
