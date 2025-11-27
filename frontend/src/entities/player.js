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
		this.currenthealth = playerInfo.currenthealth;
		this.isLocalPlayer = isLocalPlayer;
		this.x = playerInfo.x;
		this.y = playerInfo.y;
		this.actionzoneTarget = null;
		this.actionanimstarted = false;

		scene.add.existing(this);
		scene.physics.add.existing(this);

		this.body.setSize(16, 16);
		this.body.setOffset(24, 48);
		this.setDepth(15);
		this.setScale(2);

		this.speed = 200;
		this.runSpeed = 350;
		this.currentAnim = playerInfo.anim || "idle_down";
		this.lastDirection = "down"; // Hauptvariable für Bewegungsrichtung
		this.state = "idle";

		// -------------------------------------------------------
		// ACTIONZONE – Fix gegen hitAreaCallback-Fehler
		// -------------------------------------------------------
		this.actionzoneOffset = { x: 0, y: 32 };
		this.actionzone = this.scene.add.rectangle(this.x + this.actionzoneOffset.x, this.y + this.actionzoneOffset.y, 32, 32, 0xffffff, 0);

		// absolut nicht-interaktiv
		this.actionzone.disableInteractive();
		this.actionzone.input = null;

		// Physics aktivieren, keine Input-Events
		this.scene.physics.add.existing(this.actionzone, false);
		this.actionzone.body.setAllowGravity(false);
		this.actionzone.body.setImmovable(true);
		this.actionzone.setDepth(11);

		// -------------------------------------------------------
		// NAMETAG
		// -------------------------------------------------------
		this.nameText = scene.add
			.text(this.x, this.y - 40, this.name, {
				fontSize: "14px",
				color: "#fff",
			})
			.setOrigin(0.5);

		// -------------------------------------------------------
		// LOKALER SPIELER – Kamera + Steuerung
		// -------------------------------------------------------
		if (isLocalPlayer) {
			this.keys = scene.input.keyboard.addKeys({
				up: Phaser.Input.Keyboard.KeyCodes.W,
				down: Phaser.Input.Keyboard.KeyCodes.S,
				left: Phaser.Input.Keyboard.KeyCodes.A,
				right: Phaser.Input.Keyboard.KeyCodes.D,
				shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
			});

			this.camera = scene.cameras.main;
			this.camera.startFollow(this);

			this.keyPlus = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS);
			this.keyMinus = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS);
			this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

			this.freeCameraMode = false;
			this.dragging = false;

			scene.input.on("pointerdown", (pointer) => {
				if (this.freeCameraMode && !pointer.rightButtonDown()) {
					this.dragging = true;
					this.dragX = pointer.x;
					this.dragY = pointer.y;
				}
			});

			scene.input.on("pointerup", () => (this.dragging = false));

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

			scene.input.on("wheel", (pointer, gameObjects, dx, dy) => {
				if (dy > 0) this.camera.zoom = Phaser.Math.Clamp(this.camera.zoom - 0.1, 0.5, 3);
				else this.camera.zoom = Phaser.Math.Clamp(this.camera.zoom + 0.1, 0.5, 3);
			});
		}

		// PLAYERDATA UPDATE
		socket.on("player:getData", (playerData) => {
			this.money = playerData.money;
			this.exp = playerData.exp;
			this.level = playerData.level;
			this.currenthealth = playerData.currenthealth;
			this.x = playerData.x;
			this.y = playerData.y;
		});
	}

	// -----------------------------------------------------------------------------------------
	// UPDATE
	// -----------------------------------------------------------------------------------------
	setPosition(x, y) {
		super.setPosition(x, y);
		if (this.nameText) this.nameText.setPosition(this.x, this.y - 40);
		return this;
	}

	destroy(fromScene) {
		if (this.nameText) {
			this.nameText.destroy();
			this.nameText = null;
		}
		super.destroy(fromScene);
	}

	update() {
		if (!this.scene || !this.scene.sys || !this.scene.sys.isActive()) return;

		// Actionzone folgen lassen
		this.actionzone.setPosition(this.x + this.actionzoneOffset.x, this.y + this.actionzoneOffset.y);

		this.setActionzoneDirection(this.actionzone, this.lastDirection);

		if (this.isLocalPlayer) {
			this.updateCameraControls();
			if (this.state !== "action" && !this.freeCameraMode) this.handleMovement();
		}

		if (this.nameText) this.nameText.setPosition(this.x, this.y - 40);

		this.scene.socket.emit("playerMovement", {
			socket_id: this.socket_id,
			x: this.x,
			y: this.y,
			anim: this.currentAnim,
		});
	}

	// -----------------------------------------------------------------------------------------
	// MOVEMENT
	// -----------------------------------------------------------------------------------------
	handleMovement() {
		let vx = 0;
		let vy = 0;
		let anim = null;

		const ui = this.scene.scene.get("UIScene");
		const joy = ui ? ui.getJoystickVector() : { x: 0, y: 0 };

		const joystickLength = Math.sqrt(joy.x * joy.x + joy.y * joy.y);
		const joystickActive = joystickLength > 0.2;

		const joystickSprint = joystickLength > 0.75;
		const isRunning = this.keys.shift.isDown || joystickSprint;

		const currentSpeed = isRunning ? this.runSpeed : this.speed;

		// JOYSTICK
		if (joystickActive) {
			vx = joy.x * currentSpeed;
			vy = joy.y * currentSpeed;

			if (Math.abs(joy.x) > Math.abs(joy.y)) this.lastDirection = joy.x > 0 ? "right" : "left";
			else this.lastDirection = joy.y > 0 ? "down" : "up";

			anim = (isRunning ? "run_" : "walk_") + this.lastDirection;
		}

		// KEYBOARD
		else {
			if (this.keys.left.isDown) {
				vx = -currentSpeed;
				this.lastDirection = "left";
				anim = isRunning ? "run_left" : "walk_left";
			} else if (this.keys.right.isDown) {
				vx = currentSpeed;
				this.lastDirection = "right";
				anim = isRunning ? "run_right" : "walk_right";
			}

			if (this.keys.up.isDown) {
				vy = -currentSpeed;
				this.lastDirection = "up";
				anim = isRunning ? "run_up" : "walk_up";
			} else if (this.keys.down.isDown) {
				vy = currentSpeed;
				this.lastDirection = "down";
				anim = isRunning ? "run_down" : "walk_down";
			}
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

	// -----------------------------------------------------------------------------------------
	// ACTIONZONE
	// -----------------------------------------------------------------------------------------
	setActionzoneDirection(actionzone, direction) {
		const offsets = {
			left: { x: -32, y: 16 },
			right: { x: 32, y: 16 },
			up: { x: 0, y: -16 },
			down: { x: 0, y: 48 },
		};

		if (offsets[direction]) this.actionzoneOffset = offsets[direction];

		actionzone.setDepth(direction === "up" ? 8 : 11);
	}

	playActionAnimation(animKey, duration = 100) {
		if (!this.actionanimstarted) {
			this.actionanimstarted = true;

			if (animKey === "tree" && this.actionzoneTarget) this.actionzoneTarget.gathering_tree();
			if (animKey === "rock" && this.actionzoneTarget) this.actionzoneTarget.gathering_rock();

			this.state = "action";
			this.setVelocity(0, 0);

			const fullAnimKey = animKey + "_" + this.lastDirection;
			this.play(fullAnimKey, true);
			this.currentAnim = fullAnimKey;

			this.scene.time.delayedCall(duration, () => {
				if (this.state === "action") {
					this.state = "idle";
					const idleAnim = `idle_${this.lastDirection}`;
					this.play(idleAnim, true);
					this.currentAnim = idleAnim;
					this.actionanimstarted = false;
				}
			});
		}
	}

	// -----------------------------------------------------------------------------------------
	// CAMERA
	// -----------------------------------------------------------------------------------------
	updateCameraControls() {
		if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
			this.freeCameraMode = !this.freeCameraMode;
			if (this.freeCameraMode) this.camera.stopFollow();
			else this.camera.startFollow(this);
		}

		if (this.freeCameraMode) {
			const moveSpeed = 10 / this.camera.zoom;

			if (this.keys.left.isDown) this.camera.scrollX -= moveSpeed;
			else if (this.keys.right.isDown) this.camera.scrollX += moveSpeed;

			if (this.keys.up.isDown) this.camera.scrollY -= moveSpeed;
			else if (this.keys.down.isDown) this.camera.scrollY += moveSpeed;
		}

		if (Phaser.Input.Keyboard.JustDown(this.keyPlus)) this.camera.zoom = Phaser.Math.Clamp(this.camera.zoom + 0.1, 0.5, 3);
		if (Phaser.Input.Keyboard.JustDown(this.keyMinus)) this.camera.zoom = Phaser.Math.Clamp(this.camera.zoom - 0.1, 0.5, 3);
	}

	// -----------------------------------------------------------------------------------------
	// LIVE-UPDATES → UI
	// -----------------------------------------------------------------------------------------
	set currenthealth(v) {
		this._currenthealth = v;
		this.updatePlayer();
		this.scene.events.emit("playerHealthChanged", v);
	}

	get currenthealth() {
		return this._currenthealth;
	}

	set money(v) {
		this._money = v;
		this.updatePlayer();
		this.scene.events.emit("playerMoneyChanged", v);
	}

	get money() {
		return this._money;
	}

	set exp(v) {
		this._exp = v;
		this.updatePlayer();
		this.scene.events.emit("playerExpChanged", v);
	}

	get exp() {
		return this._exp;
	}

	set level(v) {
		this._level = v;
		this.updatePlayer();
		this.scene.events.emit("playerLevelChanged", v);
	}

	get level() {
		return this._level;
	}

	updatePlayer() {
		socket.emit("player:update", {
			money: this.money,
			exp: this.exp,
			level: this.level,
			currenthealth: this.currenthealth,
			x: this.x,
			y: this.y,
			id: this.player_id,
		});
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
}
