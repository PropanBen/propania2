// src/data/professionsData.js

const professionsData = {
	carpenter: {
		id: "carpenter",
		name: "Carpenter",
		unlockCost: 200,
		description: "Works with wood and buildings.",
		activeSkills: {
			chop_tree: {
				id: "chop_tree",
				name: "Chop Tree",
				levelRequired: 1,
				cooldown: 2000,
				baseExp: 5,
			},
		},
		passives: {
			wood_yield: {
				id: "wood_yield",
				description: "+10% wood yield",
				effect: (level) => ({ woodMultiplier: 1 + level * 0.1 }),
			},
		},
	},

	blacksmith: {
		id: "blacksmith",
		name: "Blacksmith",
		unlockCost: 300,
		description: "Works with metals and weapons.",
		activeSkills: {
			mine_ore: {
				id: "mine_ore",
				name: "Mine Ore",
				levelRequired: 1,
				cooldown: 2500,
				baseExp: 6,
			},
		},
		passives: {
			metal_yield: {
				id: "metal_yield",
				description: "+10% ore yield",
				effect: (level) => ({ oreMultiplier: 1 + level * 0.1 }),
			},
		},
	},

	farmer: {
		id: "farmer",
		name: "Farmer",
		unlockCost: 150,
		description: "Grows crops and food.",
		activeSkills: {
			harvest_crop: {
				id: "harvest_crop",
				name: "Harvest Crop",
				levelRequired: 1,
				cooldown: 1500,
				baseExp: 4,
			},
		},
		passives: {
			crop_growth: {
				id: "crop_growth",
				description: "Faster crop growth",
				effect: (level) => ({ cropGrowthSpeed: 1 + level * 0.15 }),
			},
		},
	},

	fisher: {
		id: "fisher",
		name: "Fisher",
		unlockCost: 120,
		description: "Catches fish.",
		activeSkills: {
			fish: {
				id: "fish",
				name: "Fishing",
				levelRequired: 1,
				cooldown: 3000,
				baseExp: 5,
			},
		},
		passives: {
			fish_chance: {
				id: "fish_chance",
				description: "+5% rare fish chance",
				effect: (level) => ({ rareFishChance: level * 0.05 }),
			},
		},
	},

	healer: {
		id: "healer",
		name: "Healer",
		unlockCost: 250,
		description: "Supports with healing.",
		activeSkills: {
			heal: {
				id: "heal",
				name: "Heal",
				levelRequired: 1,
				cooldown: 5000,
				baseExp: 8,
			},
		},
		passives: {
			healing_bonus: {
				id: "healing_bonus",
				description: "+10% healing power",
				effect: (level) => ({ healingPower: 1 + level * 0.1 }),
			},
		},
	},
};

export default professionsData;
