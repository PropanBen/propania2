// inventoryUI.js
import { itemRegistry } from "./itemregistry.js";

export default class InventoryUI {
	constructor(scene, inventory, layout = {}) {
		this.scene = scene;
		this.inventory = inventory;

		this.layout = {
			size: layout.size || "full",
			position: layout.position || "center",
		};

		this.type = "drop";
		this.isVisible = false;

		this.ui = document.createElement("div");
		this.ui.className = "inventory-ui";

		this.ui.innerHTML = `
			<div class="inventory-header">
				<span class="inventory-title">Inventory</span>
				<button class="inventory-close">X</button>
			</div>
			<div class="inventory-items"></div>
			<div class="inventory-popup">
				<div class="popup-content">
					<p class="popup-description"></p>
					<p class="popup-price"></p>
					<button class="popup-close">Close</button>
				</div>
			</div>
		`;

		document.body.appendChild(this.ui);

		this.itemsContainer = this.ui.querySelector(".inventory-items");
		this.popup = this.ui.querySelector(".inventory-popup");
		this.popupDescription = this.ui.querySelector(".popup-description");
		this.popupPrice = this.ui.querySelector(".popup-price");

		this.ui.querySelector(".inventory-close").addEventListener("click", () => this.hide());
		this.ui.querySelector(".popup-close").addEventListener("click", () => this.hidePopup());

		// Drag & Drop
		this.initDrag();

		this.applyLayout();
		window.addEventListener("resize", () => this.applyLayout());
	}

	// =================================================
	// Drag & Drop
	// =================================================
	initDrag() {
		const header = this.ui.querySelector(".inventory-header");
		let offsetX = 0,
			offsetY = 0,
			isDragging = false;

		header.style.cursor = "grab";

		header.addEventListener("mousedown", (e) => {
			isDragging = true;
			offsetX = e.clientX - this.ui.getBoundingClientRect().left;
			offsetY = e.clientY - this.ui.getBoundingClientRect().top;
			header.style.cursor = "grabbing";
			e.preventDefault();
		});

		document.addEventListener("mousemove", (e) => {
			if (!isDragging) return;
			const x = e.clientX - offsetX;
			const y = e.clientY - offsetY;
			Object.assign(this.ui.style, {
				left: `${x}px`,
				top: `${y}px`,
				transform: "none", // transform entfernen beim Drag
			});
		});

		document.addEventListener("mouseup", () => {
			if (isDragging) {
				isDragging = false;
				header.style.cursor = "grab";
			}
		});
	}

	// =================================================
	// Layout
	// =================================================
	setLayout(layout = {}) {
		this.layout = { ...this.layout, ...layout };
		this.applyLayout();
	}

	applyLayout() {
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		let widthFactor = 0.6;
		let heightFactor = 0.7;

		if (this.layout.size === "half") widthFactor = 0.45;
		if (this.layout.size === "quarter") widthFactor = 0.3;

		const width = vw * widthFactor;
		const height = vh * heightFactor;

		let left, top;
		let transform = "";

		switch (this.layout.position) {
			case "left":
				left = vw * 0.05;
				top = vh / 2;
				transform = "translateY(-50%)";
				break;
			case "right":
				left = vw - width - vw * 0.05;
				top = vh / 2;
				transform = "translateY(-50%)";
				break;
			default:
				left = vw / 2;
				top = vh / 2;
				transform = "translate(-50%, -50%)";
				break;
		}

		// Nur Layout setzen, wenn noch nicht per Drag verschoben
		if (!this.isDraggingManual) {
			Object.assign(this.ui.style, {
				position: "fixed",
				width: `${width}px`,
				height: `${height}px`,
				left: `${left}px`,
				top: `${top}px`,
				transform: transform,
				display: this.isVisible ? "flex" : "none",
				maxHeight: `${vh * 0.9}px`,
				overflowY: "auto",
			});
		}
	}

	// =================================================
	// INVENTORY
	// =================================================
	setInventory(inventory, type) {
		this.inventory = inventory;
		this.type = type;
		this.refresh();
	}

	refresh() {
		if (!this.inventory || !this.inventory.items) return;
		this.itemsContainer.innerHTML = "";

		this.inventory.items.forEach((item) => {
			const itemDiv = document.createElement("div");
			itemDiv.className = "inventory-item";

			itemDiv.innerHTML = `
				<div class="item-icon">
					<img class="item-icon-img" src="/src/assets/items/${item.key}.png" />
				</div>
				<div class="item-info">
					<span class="item-name">${item.name}</span>
					<span class="item-quantity">x${item.quantity}</span>
				</div>
				<div class="item-controls">
					<img class="minus-btn" src="/src/assets/ui/minus_red.png" />
					<input type="number" class="drop-amount" value="1" min="1" max="${item.quantity}" />
					<img class="plus-btn" src="/src/assets/ui/plus_green.png" />
					<button class="action-btn">${this.getActionText()}</button>
				</div>
			`;

			const dropInput = itemDiv.querySelector(".drop-amount");
			const minusBtn = itemDiv.querySelector(".minus-btn");
			const plusBtn = itemDiv.querySelector(".plus-btn");
			const actionBtn = itemDiv.querySelector(".action-btn");
			const iconImg = itemDiv.querySelector(".item-icon-img");
			const name = itemDiv.querySelector(".item-name");

			let amount = 1;

			minusBtn.addEventListener("click", () => {
				amount = amount === 1 ? item.quantity : amount - 1;
				dropInput.value = amount;
			});

			plusBtn.addEventListener("click", () => {
				amount = amount === item.quantity ? 1 : amount + 1;
				dropInput.value = amount;
			});

			dropInput.addEventListener("input", () => {
				amount = Math.min(item.quantity, Math.max(1, Number(dropInput.value) || 1));
				dropInput.value = amount;
			});

			actionBtn.addEventListener("click", () => this.performAction(item, amount));
			iconImg.addEventListener("click", () => this.showPopup(item));
			name.addEventListener("click", () => this.showPopup(item));

			this.itemsContainer.appendChild(itemDiv);
		});
	}

	getActionText() {
		if (this.type === "buy") return "Buy";
		if (this.type === "sell") return "Sell";
		return "Drop";
	}

	performAction(item, amount) {
		if (!this.inventory) return;
		if (this.type === "drop") this.inventory.dropItem(this.inventory.inventory_id, item, amount);
		if (this.type === "buy") this.inventory.buyItem(this.inventory.inventory_id, item.item_id, amount);
		if (this.type === "sell") this.inventory.sellItem(this.inventory.inventory_id, item.item_id, amount);
	}

	showPopup(item) {
		const def = itemRegistry.get(item.item_id);
		this.popupDescription.textContent = def.description || "No description";
		this.popupPrice.textContent = "Price: " + (def.price ?? "-");
		this.popup.style.display = "flex";
	}

	hidePopup() {
		this.popup.style.display = "none";
	}

	toggle() {
		this.isVisible = !this.isVisible;
		this.applyLayout();
		if (this.isVisible) this.refresh();
	}

	hide() {
		this.isVisible = false;
		this.applyLayout();
		this.hidePopup();
	}

	destroy() {
		this.hidePopup();
		if (this.ui) this.ui.remove();
		this.ui = null;
	}
}
