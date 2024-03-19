import { KinkLevel } from '$lib/enums/Kink.enum';

/**
 * Kink model
 * @class
 * @classdesc A kink model
 * @param {string} name - The name of the kink
 * @param {string} description - The description of the kink
 * @param {KinkLevel} level - The level of the kink
 * @param {KinkLevel} seccondaryLevel - The secondary level of the kink
 * @example
 * const kink = new Kink('Bondage', 'The act of tying someone up', KinkLevel.Light);
 * console.log(kink); // Kink { name: 'Bondage', description: 'The act of tying someone up', level: KinkLevel.Light }
 */
export class Kink {
	constructor(
		public name: string,
		public description: string,
		public level: KinkLevel,
		public seccondaryLevel?: KinkLevel
	) {}
}
