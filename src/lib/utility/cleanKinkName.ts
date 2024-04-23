/**
 * Cleans kink name
 * @param kinkName 
 * @returns kink name 
 * @category Utility
 * @description Cleans kink name by converting it to lowercase and replacing all missleading characters with '_'
 * @example
 * cleanKinkName('Bondage & Discipline') => 'bondage-&-discipline'
 */
export function cleanKinkName(kinkName: string): string {
	    return kinkName.toLowerCase().replaceAll(' ', '').replaceAll(/[^a-z0-9]/g, '-');
}