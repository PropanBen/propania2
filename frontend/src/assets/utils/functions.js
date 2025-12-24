import defaultTextStyle from "./functions.js";

export default class Functions {
	static getFrameFromItemListWithKey(key, itemslist) {
		const itemData = itemslist.find((item) => item.key === key);
		if (!itemData) {
			console.warn(`Item key "${key}" not found in itemslist.js.`);
			return 0;
		}
		return itemData.frame;
	}

	static defaultTextStyle = {
		fontFamily: "Pixel Code",
		fontSize: "20px",
		color: "#000000ff",
		align: "left",
	};
}
