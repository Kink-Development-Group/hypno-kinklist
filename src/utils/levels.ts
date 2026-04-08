import { LevelsData } from '../types'

const DEFAULT_LEVEL_KEY = 'notEntered'

export const getDefaultLevelKey = (levels: LevelsData): string | undefined => {
  const matchingEntry = Object.entries(levels).find(
    ([levelName, level]) =>
      levelName === DEFAULT_LEVEL_KEY ||
      level.key === DEFAULT_LEVEL_KEY ||
      level.class === DEFAULT_LEVEL_KEY
  )

  if (matchingEntry) {
    return matchingEntry[0]
  }

  return Object.keys(levels).sort((a, b) => a.localeCompare(b))[0]
}
