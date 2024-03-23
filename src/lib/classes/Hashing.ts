/**
 * A class to handle encoding and decoding of selection hashes
 */
export class LegacyHashHandler {
	/**
	 * Encode a selection into a hash
	 * @param selection The selection to encode
	 * @returns The encoded hash
	 *
	 * @example
	 * const selection = [1, 2, 3, 4, 5];
	 * const hash = HashHandler.encodeSelection(selection);
	 * console.log(hash); // "aBcDeF"
	 */
	public static encodeSelection(selection: number[]): string {
		const hashChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.=+*^!@';
		const base = hashChars.length;
		const maxPow = (base: number, max: number): number => {
			let pow = 1;
			while (Math.pow(base, pow) <= max) {
				pow++;
			}
			return pow - 1;
		};
		const maxIndex = maxPow(base, Number.MAX_SAFE_INTEGER);
		const chunkSize = maxPow(selection.length, Math.pow(base, maxIndex));
		const paddedSelection: number[] = [];
		for (let i = 0; i < selection.length; i++) {
			const chunk = selection[i];
			let paddedChunk = 0; // Convert paddedChunk to a number
			for (let j = 0; j < chunkSize; j++) {
				const charIndex = Math.floor(chunk / Math.pow(base, j)) % base;
				paddedChunk += charIndex * Math.pow(base, j);
			}
			paddedSelection.push(paddedChunk);
		}
		let encoded = '';
		for (let i = 0; i < paddedSelection.length; i++) {
			encoded += paddedSelection[i];
		}
		return encoded;
	}

	/**
	 * Decode a hash into a selection
	 * @param hash The hash to decode
	 * @returns The decoded selection
	 *
	 * @example
	 * const hash = "aBcDeF";
	 * const selection = HashHandler.decodeSelection(hash);
	 * console.log(selection); // [1, 2, 3, 4, 5]
	 */
	public static decodeSelection(hash: string): number[] {
		const hashChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.=+*^!@';
		const base = hashChars.length;
		const maxIndex = Math.max(hash.length / base, 1);
		const chunkSize = Math.ceil(hash.length / maxIndex);
		const decoded: number[] = [];
		for (let i = 0; i < hash.length; i += chunkSize) {
			const chunk = hash.substring(i, i + chunkSize);
			let chunkValue = 0;
			for (let j = 0; j < chunk.length; j++) {
				const charIndex = hashChars.indexOf(chunk[j]);
				chunkValue += charIndex * Math.pow(base, j);
			}
			decoded.push(chunkValue);
		}
		return decoded;
	}
}
