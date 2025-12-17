export default class NPC extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, x, y, texture, name, type, id) {
		super(scene, x, y, texture);

		this.scene = scene;
		this.id = id;
		this.name = name;
		this.type = type;

		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.scene.npcGroup.add(this);
		this.setInteractive();

		this.body.setSize(16, 16);
		this.body.setOffset(24, 48);
		this.setDepth(1000);
		this.setScale(2);
		this.body.allowGravity = false;
		this.body.setImmovable(true);

		this.nameText = scene.add
			.text(this.x, this.y - 60, this.name, {
				fontSize: "14px",
				color: "#ffffff",
			})
			.setOrigin(0.5)
			.setDepth(1001);
	}
}
