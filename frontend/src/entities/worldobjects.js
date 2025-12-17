export default class WorldObject extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, x, y, texture, name, type) {
		super(scene, x, y, texture);

		this.scene = scene;
		this.name = name;
		this.type = type;

		scene.add.existing(this);
		scene.physics.add.existing(this, true);
		this.scene.worldobjectsGroup.add(this);

		this.setScale(0.5);
		this.setDepth(10);

		this.body.setSize(230, 80);
		this.body.setOffset(140, 200);
	}
}
