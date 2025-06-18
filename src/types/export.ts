export interface ExportData {
  metadata: {
    exportDate: string
    version: string
    username?: string
    totalCategories: number
    totalKinks: number
    totalSelections: number
  }
  levels: {
    [key: string]: {
      name: string
      color: string
      class: string
    }
  }
  categories: {
    name: string
    fields: string[]
    kinks: {
      name: string
      description?: string
      selections: {
        [field: string]: {
          level: string
          comment?: string
        }
      }
    }[]
  }[]
}

export interface ExportOptions {
  format: ExportFormat
  filename?: string
  includeComments: boolean
  includeDescriptions: boolean
  includeMetadata: boolean
  compress?: boolean
}

export type ExportFormat =
  | 'PNG'
  | 'PDF'
  | 'JPEG'
  | 'WebP'
  | 'SVG'
  | 'JSON'
  | 'XML'
  | 'CSV'

export type ExportMode = 'quick' | 'advanced'

export interface ExportModeOption {
  mode: ExportMode
  title: string
  description: string
  formats: ExportFormat[]
  defaultOptions: Partial<ExportOptions>
}

export interface ExportResult {
  success: boolean
  filename: string
  size?: number
  error?: string
}

export interface ImportResult {
  success: boolean
  data?: ExportData
  error?: string
}
