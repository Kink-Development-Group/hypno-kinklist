import { Selection } from '../types'

export type StableIdFields = Partial<
  Pick<Selection, 'categoryId' | 'kinkId' | 'fieldId'>
>

export const hasUsableStableIds = (ids: StableIdFields) =>
  Boolean(ids.categoryId) && Boolean(ids.kinkId) && Boolean(ids.fieldId)

export const backfillStableId = (
  existingId: Selection['categoryId'],
  stableId: Selection['categoryId']
) => (existingId === undefined || existingId === '' ? stableId : existingId)
