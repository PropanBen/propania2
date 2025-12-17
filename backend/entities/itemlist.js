// itemslist.js
// Liste aller Items mit ihren Keys und optionalen IDs/Namen
// Die Frame-Index-Nummer entspricht der Position im Spritesheet (0-basiert)

const itemsList = [
	{ item_id: "1", key: "mushroom", name: "Mushroom", description: "A Tasty Mushroom", frame: 30, price: 2 },
	{ item_id: "4", key: "coin", name: "Coin", description: "Shiny Coin", frame: 1, price: 1 },
	{ item_id: "5", key: "potion", name: "Health Potion", description: "Heals you well", frame: 2, price: 100 },
	{ item_id: "6", key: "sword", name: "Sword", description: "To fight Monsters", frame: 50, price: 150 },
	{ item_id: "7", key: "shield", name: "Shield", description: "To Protect you", frame: 4, price: 120 },
	{ item_id: "2", key: "log", name: "Log", description: "Hard as Wood", frame: 3, price: 5 },
	{ item_id: "3", key: "stone", name: "Stone", description: "Hard as a Rock", frame: 11, price: 5 },
	{ item_id: "8", key: "meat", name: "meat", description: "Well done or Rare you should compare", frame: 31, price: 5 },
	{ item_id: "9", key: "wool", name: "Wool", description: "Soft and fluffy", frame: 32, price: 5 },
	{ item_id: "20", key: "pickaxe", name: "Pickaxe", description: "To gather stones from rocks", frame: 20, price: 100 },
	{ item_id: "21", key: "axe", name: "Axe", description: "To gather wood from trees", frame: 21, price: 100 },
];

export default itemsList;
