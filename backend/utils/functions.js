export default class Functions {
	static randomFloatRange(min, max) {
		return Math.random() * (max - min) + min;
	}
}
