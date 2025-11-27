import { socket } from "../socket.js";
import Functions from "../assets/utils/functions.js";

export default class UIScene extends Phaser.Scene {
	constructor() {
		super("UIScene");
		this.sceneKey = "UIScene";
	}

	create() {
		this.socket = socket;

		const gameScene = this.scene.get("GameScene");

		const healthbtn = this.add.sprite(30, 30, "hp").setScale(3);
		const xpbtn = this.add.sprite(30, 80, "xp").setScale(3);
		const moneybtn = this.add.sprite(30, 130, "money").setScale(3);
		const lvlbtn = this.add.sprite(30, 180, "lvl").setScale(3);

		this.healthText = this.add.text(60, 20, "", Functions.defaultTextStyle);
		this.xpText = this.add.text(60, 70, "0", Functions.defaultTextStyle);
		this.moneyText = this.add.text(60, 120, "0", Functions.defaultTextStyle);
		this.lvlText = this.add.text(60, 170, "1", Functions.defaultTextStyle);

		gameScene.events.on("playerHealthChanged", (newHealth) => {
			this.healthText.setText(`${newHealth}/100`);
		});

		gameScene.events.on("playerMoneyChanged", (newMoney) => {
			this.moneyText.setText(`${newMoney}`);
		});

		gameScene.events.on("playerExpChanged", (newExp) => {
			this.xpText.setText(`${newExp}`);
		});

		gameScene.events.on("playerLevelChanged", (newLvL) => {
			this.lvlText.setText(`${newLvL}`);
		});
	}
}
