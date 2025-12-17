import itemsList from "../entities/itemslist.js";
import { socket } from "../socket.js";

export default class Inventory {
	constructor(inventory_id, type) {
		this.inventory_id = inventory_id;
		this.type = type;
		this.capacity = null;
		this.items = [];
		this.itemsList = itemsList;
		this.isOpen = false;
	}

	// ----------------------------------------------
	// ➕ Add item
	// ----------------------------------------------
	addItem(inventory_id, item, quantity = 1) {
		socket.emit("inventory:item:add", inventory_id, item, quantity);
	}

	// ----------------------------------------------
	// ➖ Remove Item
	// ----------------------------------------------
	removeItem(item, quantity = 1) {
		socket.emit("inventory:item:remove", inventory_id, item, quantity);
	}

	// ----------------------------------------------
	// ➖ Pickup Item
	// ----------------------------------------------

	pickupItem(inventory_id, item, quantity = 1) {
		const senditem = { item_id: item.item_id, world_item_id: item.world_item_id };
		socket.emit("inventory:item:pickup", inventory_id, senditem, quantity);
	}

	// ----------------------------------------------
	// ➖ Drop Item
	// ----------------------------------------------

	dropItem(inventory_id, item, quantity = 1) {
		socket.emit("inventory:item:drop", inventory_id, item, quantity);
	}

	buyItem(inventory_id, item, quantity = 1) {
		socket.emit("inventory:item:buy", inventory_id, item, quantity);
	}
	sellItem(inventory_id, item, quantity = 1) {
		socket.emit("inventory:item:sell", inventory_id, item, quantity);
	}

	hasItem(item, quantity = 1) {
		return this.items[item.item_id] && this.items[item.item_id].quantity >= quantity;
	}

	updateInventory() {
		socket.emit("inventory:load");
	}

	loadFromServer(data) {
		this.items = [];
		if (!data || !Array.isArray(data.items)) {
			console.warn("Ungültige Serverdaten:", data);
			return;
		}

		this.capacity = data.capacity || 10;

		this.items = data.items.map((item) => ({
			item_id: item.item_id,
			key: item.key,
			name: item.name,
			quantity: item.quantity,
			description: this.itemsList.find((i) => i.key === item.key)?.description ?? "",
		}));
	}

	printInventory() {
		console.log("Inventory Inhalt:", this.items);
	}
}
