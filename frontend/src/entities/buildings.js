export default class Building extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, x, y, data) {
		super(scene, x, y, data.type);

		this.scene = scene;
		this.building_id = data.id;
		this.type = data.type;
		this.isDoorOpen = false;

		// 👇 State direkt als String
		this.state = "standard";

		this.setOrigin(0, 0);
		this.setDepth(11);
		this.setScale(1);

		scene.add.existing(this);
		scene.physics.add.existing(this);

		this.body.setSize(192, 192);
		this.body.setOffset(0, 64);
		//scene.buildingsGroup.add(this);

		// === WALL COLLIDER (BLOCKIERT IMMER) ===
		this.colliders = [];

		this.collider_door_left_bottom = scene.physics.add.staticImage(x, y);
		this.collider_door_left_bottom.setSize(80, 1).setOffset(16, 271);
		this.colliders.push(this.collider_door_left_bottom);

		this.collider_door_right_bottom = scene.physics.add.staticImage(x, y);
		this.collider_door_right_bottom.setSize(80, 1).setOffset(128, 271);
		this.colliders.push(this.collider_door_right_bottom);

		this.collider_wall_left = scene.physics.add.staticImage(x, y);
		this.collider_wall_left.setSize(1, 192).setOffset(16, 80);
		this.colliders.push(this.collider_wall_left);

		this.collider_wall_right = scene.physics.add.staticImage(x, y);
		this.collider_wall_right.setSize(1, 192).setOffset(208, 80);
		this.colliders.push(this.collider_wall_right);

		this.collider_wall_top = scene.physics.add.staticImage(x, y);
		this.collider_wall_top.setSize(192, 1).setOffset(16, 80);
		this.colliders.push(this.collider_wall_top);

		this.colliders.forEach((c) => scene.wallsGroup.add(c));

		// 🚪 Door Blocker (physisch)
		this.doorBlocker = scene.physics.add.staticImage(x, y);
		this.doorBlocker.setSize(32, 48).setOffset(96, 224);
		scene.wallsGroup.add(this.doorBlocker);

		// 🚪 Door Trigger (Interaktion)
		this.doorTrigger = scene.physics.add.staticImage(x, y);
		this.doorTrigger.setSize(32, 48).setOffset(96, 224);
		this.doorTrigger.building = this;
		scene.triggerGroup.add(this.doorTrigger);

		// 🏠 Inside Trigger
		this.insideTrigger = scene.physics.add.staticImage(x, y);
		this.insideTrigger.setSize(32, 32).setOffset(96, 224);
		this.insideTrigger.building = this;
		this.insideTrigger.name = "insideTrigger";
		scene.triggerGroup.add(this.insideTrigger);

		// 🏠 Outside Trigger
		this.OutsideTrigger = scene.physics.add.staticImage(x, y);
		this.OutsideTrigger.setSize(32, 32).setOffset(96, 272);
		this.OutsideTrigger.building = this;
		this.OutsideTrigger.name = "outsideTrigger";
		scene.triggerGroup.add(this.OutsideTrigger);
	}

	// 🔁 Tür öffnen / schließen
	openDoor() {
		if (this.isDoorOpen) {
			// Tür schließen
			this.scene.sound.play("closedoor");
			this.isDoorOpen = false;
			this.setState("standard");
			this.doorBlocker.body.enable = true;
		} else {
			// Tür öffnen
			this.scene.sound.play("opendoor");
			this.isDoorOpen = true;
			this.setState("dooropen");
			this.doorBlocker.body.enable = false;
		}
	}

	setState(newState) {
		if (this.state === newState) return;

		this.state = newState;
		this.updateTextureByState();
	}

	updateTextureByState() {
		this.setTexture(this.getTextureKey(this.state));
	}

	getTextureKey(state) {
		if (state === "standard") return this.type;
		return `${this.type}_${state}`;
	}
}
