/**
 * Kink level enum
 * @example
 * const kinkLevel = KinkLevel.Favorite;
 * @example
 * const kinkLevel = KinkLevel.Like;
 */
export enum KinkLevel {
	Blank = -1,
	NotEntered = 0,
	Favorite = 1,
	Like = 2,
	Okay = 3,
	Maybe = 4,
	No = 5
}
