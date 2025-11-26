// inventory.js
export default class Inventory {
	constructor(scene, capacity = 20) {
		this.scene = scene; // GameScene
		this.capacity = capacity;
		this.items = [];
		this.visible = false;
		this.uiScene = null;
		this.container = null; // Container für drag & drop
		this.containerbg = null;
		this.dragOffset = { x: 0, y: 0 };
	}

	// Initialisiert das UI in der UIScene
	initUI(uiScene) {
		this.uiScene = uiScene;
		// Hintergrund-Graphics
		this.containerbg = uiScene.add.graphics();
		this.containerbg.fillStyle(0xdeb887, 0.8);
		this.containerbg.fillRoundedRect(0, 0, 300, 200, 10);

		// Container erstellen
		this.container = uiScene.add.container(200, 200, [this.containerbg]).setDepth(1000);
		this.container.setVisible(this.visible);

		// Container interaktiv machen über das Hintergrund-Graphics
		this.containerbg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 300, 200), Phaser.Geom.Rectangle.Contains);

		// Drag & Drop aktivieren
		uiScene.input.setDraggable(this.containerbg);

		uiScene.input.on("dragstart", (pointer, gameObject) => {
			if (gameObject === this.containerbg) {
				this.dragOffset.x = pointer.x - this.container.x;
				this.dragOffset.y = pointer.y - this.container.y;
			}
		});

		uiScene.input.on("drag", (pointer, gameObject, dragX, dragY) => {
			if (gameObject === this.containerbg) {
				this.container.x = pointer.x - this.dragOffset.x;
				this.container.y = pointer.y - this.dragOffset.y;
			}
		});

		this.refreshUI();
	}

	setFromServer(payload) {
		if (payload?.capacity) this.capacity = payload.capacity;
		this.items = payload?.items ?? [];
		this.refreshUI();
	}

	toggleUI() {
		if (!this.container) return;
		this.visible = !this.visible;
		this.container.setVisible(this.visible);
		this.refreshUI();
	}

	refreshUI() {
		if (!this.container || !this.containerbg) return;

		// Falls arrays für Text & Buttons noch nicht existieren, erstellen
		if (!this.itemTexts) this.itemTexts = [];
		if (!this.itemButtons) this.itemButtons = [];

		// Anzahl der vorhandenen Text/Buttons angleichen
		while (this.itemTexts.length < this.items.length) {
			const t = this.uiScene.add.text(10, 0, "", { fontSize: "24px", color: "#000000ff" });
			this.container.add(t);
			this.itemTexts.push(t);

			const b = this.uiScene.add.sprite(250, 0, "arrow_down").setScale(2).setInteractive({ useHandCursor: true });
			this.container.add(b);
			this.itemButtons.push(b);
		}

		// Alte überzählige Text/Buttons ausblenden
		for (let i = this.items.length; i < this.itemTexts.length; i++) {
			this.itemTexts[i].setVisible(false);
			this.itemButtons[i].setVisible(false);
		}

		// Positionen und Text für aktuelle Items setzen
		this.items.forEach((it, idx) => {
			const t = this.itemTexts[idx];
			const b = this.itemButtons[idx];

			t.setText(`${idx + 1}. ${it.name} x${it.quantity}`);
			t.setY(10 + idx * 30);
			t.setVisible(true);

			b.setY(15 + idx * 30);
			b.setVisible(true);
			// Button Callback neu setzen
			b.removeAllListeners();
			b.on("pointerdown", () => this.scene.tryDrop(it));
		});
	}

	setInventoryPosition(x, y) {
		if (this.container) this.container.setPosition(x, y);
	}
}
