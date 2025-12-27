// src/entities/itemregistry.js

class ItemRegistry {
	constructor() {
		this.items = new Map();
	}

	// 🔹 Initiale Liste vom Server
	loadAll(items) {
		if (!Array.isArray(items)) {
			console.error("ItemRegistry.loadAll erwartet ein Array:", items);
			return;
		}

		items.forEach((item) => {
			this.items.set(Number(item.item_id), item);
		});
	}

	// 🔹 Einzelnes Item hinzufügen (z. B. dynamisch)
	add(item) {
		if (!item || item.item_id == null) {
			console.error("ItemRegistry.add: ungültiges Item:", item);
			return;
		}

		this.items.set(Number(item.item_id), item);
	}

	get(itemId) {
		return this.items.get(Number(itemId));
	}

	has(itemId) {
		return this.items.has(Number(itemId));
	}
}

export const itemRegistry = new ItemRegistry();
