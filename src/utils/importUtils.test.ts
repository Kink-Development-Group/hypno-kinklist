import { describe, expect, test } from 'vitest'
import { ExportData } from '../types/export'
import { convertFromExportData, validateExportData } from './importUtils'

const validExportData: ExportData = {
  metadata: {
    exportDate: '2026-03-30T00:00:00.000Z',
    version: '1.0.0',
    totalCategories: 2,
    totalKinks: 2,
    totalSelections: 3,
  },
  levels: {
    yes: {
      name: 'Yes',
      color: '#00ff00',
      class: 'yes',
    },
    maybe: {
      name: 'Maybe',
      color: '#ffff00',
      class: 'maybe',
    },
  },
  categories: [
    {
      name: 'Category A',
      fields: ['Self', 'Partner'],
      kinks: [
        {
          name: 'Kink A',
          description: 'Description A',
          selections: {
            Self: { level: 'yes', comment: 'Excited' },
            Partner: { level: 'maybe' },
          },
        },
      ],
    },
    {
      name: 'Category B',
      fields: ['Only'],
      kinks: [
        {
          name: 'Kink B',
          selections: {
            Only: { level: 'yes' },
          },
        },
      ],
    },
  ],
}

describe('importUtils', () => {
  test('validateExportData accepts a valid export payload', () => {
    expect(validateExportData(validExportData)).toBe(true)
  })

  test('validateExportData rejects payloads with missing metadata or malformed shapes', () => {
    expect(
      validateExportData({
        ...validExportData,
        metadata: {
          version: '1.0.0',
        },
      })
    ).toBe(false)

    expect(
      validateExportData({
        ...validExportData,
        categories: [
          {
            name: 'Broken category',
            fields: 'Self',
            kinks: [],
          },
        ],
      })
    ).toBe(false)

    expect(
      validateExportData({
        ...validExportData,
        categories: [
          {
            name: 'Broken category',
            fields: ['Self'],
            kinks: [
              {
                name: 'Broken kink',
                selections: null,
              },
            ],
          },
        ],
      })
    ).toBe(false)
  })

  test('convertFromExportData converts levels, categories, and selections', () => {
    const converted = convertFromExportData(validExportData)

    expect(converted.levels).toEqual({
      yes: {
        key: 'yes',
        name: 'Yes',
        color: '#00ff00',
        class: 'yes',
      },
      maybe: {
        key: 'maybe',
        name: 'Maybe',
        color: '#ffff00',
        class: 'maybe',
      },
    })

    expect(converted.kinks).toEqual({
      'Category A': {
        name: 'Category A',
        fields: ['Self', 'Partner'],
        kinks: ['Kink A'],
        descriptions: ['Description A'],
      },
      'Category B': {
        name: 'Category B',
        fields: ['Only'],
        kinks: ['Kink B'],
        descriptions: [''],
      },
    })

    expect(converted.selection).toEqual([
      {
        category: 'Category A',
        kink: 'Kink A',
        field: 'Self',
        value: 'yes',
        comment: 'Excited',
        showField: true,
      },
      {
        category: 'Category A',
        kink: 'Kink A',
        field: 'Partner',
        value: 'maybe',
        comment: undefined,
        showField: true,
      },
      {
        category: 'Category B',
        kink: 'Kink B',
        field: 'Only',
        value: 'yes',
        comment: undefined,
        showField: false,
      },
    ])
  })
})
