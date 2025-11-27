import defaultTextStyle from "./functions.js";

export default class Functions {
	static getFrameFromItemListWithKey(key, itemslist) {
		const itemData = itemslist.find((item) => item.key === key);
		if (!itemData) {
			console.warn(`Item key "${key}" nicht in itemslist.js gefunden.`);
			return 0;
		}
		return itemData.frame;
	}

	static defaultTextStyle = {
		fontFamily: "PerryGothic",
		fontSize: "20px",
		color: "#000000ff",
		align: "left",
	};
}
