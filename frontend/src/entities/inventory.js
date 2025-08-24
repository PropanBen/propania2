// src/entities/inventory.js
export default class Inventory {
	constructor(scene, capacity = 20) {
		this.scene = scene;
		this.capacity = capacity;
		this.items = []; // [{ item_id, key, name, quantity }]
		this.visible = true;

		// primitive UI: Text oben links, immer im Screen Space
		this.uiText = scene.add
			.text(16, 16, '', {
				fontSize: '14px',
				color: '#fff',
				backgroundColor: 'rgba(0,0,0,0.35)',
			})
			.setScrollFactor(0)
			.setDepth(1000);

		this.refreshUI();
	}

	setFromServer(payload) {
		// payload: { items: [{item_id, key, name, quantity}], capacity? }
		if (payload?.capacity) this.capacity = payload.capacity;
		this.items = payload?.items ?? [];
		this.refreshUI();
	}

	toggleUI() {
		this.visible = !this.visible;
		this.uiText.setVisible(this.visible);
	}

	refreshUI() {
		const lines = ['Inventar:'];
		if (this.items.length === 0) lines.push('  (leer)');
		this.items.forEach((it, idx) => {
			lines.push(`  ${idx + 1}. ${it.name} x${it.quantity}`);
		});
		this.uiText.setText(lines.join('\n'));
	}

	getFirstDroppableItem() {
		return this.items[0] ?? null;
	}
}
