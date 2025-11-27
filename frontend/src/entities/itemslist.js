// itemslist.js
// Liste aller Items mit ihren Keys und optionalen IDs/Namen
// Die Frame-Index-Nummer entspricht der Position im Spritesheet (0-basiert)

const itemsList = [
	{ key: "mushroom", name: "Mushroom", description: "A Tasty Mushroom", frame: 30, price: 2 },
	{ key: "coin", name: "Coin", description: "Shiny Coin", frame: 1, price: 1 },
	{ key: "potion", name: "Health Potion", description: "Heals you well", frame: 2, price: 100 },
	{ key: "sword", name: "Sword", description: "To fight Monsters", frame: 50, price: 150 },
	{ key: "shield", name: "Shield", description: "To Protect you", frame: 4, price: 120 },
	{ key: "log", name: "Log", description: "Hard as Wood", frame: 3, price: 5 },
	{ key: "stone", name: "Stone", description: "Hard as a Rock", frame: 11, price: 5 },
	// ...weitere Items hier hinzufügen
];

export default itemsList;
