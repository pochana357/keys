export default class StringHash {
	// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript/52171480#52171480
	static cyrb53(str: string, seed = 0): string {
		let h1 = 0xdeadbeef ^ seed,
			h2 = 0x41c6ce57 ^ seed;
		for (let i = 0, ch; i < str.length; i++) {
			ch = str.charCodeAt(i);
			h1 = Math.imul(h1 ^ ch, 2654435761);
			h2 = Math.imul(h2 ^ ch, 1597334677);
		}
		h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
		h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
		h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
		h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

		// const res = 4294967296 * (2097151 & h2) + (h1 >>> 0);
		// return res.toString(16);
		return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
	}
}
