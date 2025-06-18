export interface TranslationKeys {
  app: {
    title: string
    subtitle: string
  }
  navigation: {
    home: string
    edit: string
    export: string
    import: string
    settings: string
  }
  common: {
    or: string
    and: string
    loading: string
    error: string
    success: string
    warning: string
  }
  theme: {
    toggleDark: string
    toggleLight: string
  }
  legend: {
    title: string
    notEntered: string
    favorite: string
    like: string
    okay: string
    maybe: string
    no: string
  }
  buttons: {
    start: string
    next: string
    previous: string
    save: string
    cancel: string
    close: string
    continue: string
    edit: string
    export: string
    import: string
    delete: string
    confirm: string
    reset: string
    help: string
    focus: string
  }
  editor: {
    title: string
    placeholder: string
    toolbar: {
      bold: string
      italic: string
      help: string
      helpTooltip?: string
      validate: string
      format: string
      formatTooltip?: string
      snippets?: string
      snippetsTooltip?: string
      blocks: string
      blocksTooltip?: string
      focus: string
      focusTooltip?: string
    }
    snippets: {
      categories: {
        all: string
        category: string
        kink: string
        description: string
        template: string
      }
    }
    help: {
      sections: {
        syntax: string
        quickStart: string
        keyboardShortcuts: string
        advanced: string
      }
    }
    validation: {
      errors: string
      warnings: string
      moreItems: string
    }
  }
  export: {
    title: string
    subtitle: string
    modes: {
      quick: {
        title: string
        description: string
        formatsCount: string
      }
      advanced: {
        title: string
        description: string
        formatsCount: string
      }
    }
    formats: {
      image: string
      data: string
      document: string
      pdf: string
      json: string
      xml: string
      csv: string
    }
    options: {
      includeComments: string
      includeDescriptions: string
      compactMode: string
    }
    filename: {
      label: string
      placeholder: string
    }
    export: string
    import: string
    exportKinklist: string
    importKinklist: string
    exportSuccessful: string
    importSuccessful: string
    exportFailed: string
    importFailed: string
    preparing: string
    processing: string
    pleaseWait: string
    closeDialog: string
    quickExport: string
    advancedOptions: string
    exportMode: string
    exportSettings: string
    includeComments: string
    includeDescriptions: string
    includeMetadata: string
    exportFormats: string
    supportedFormats: string
    formatDescriptions: {
      PNG: string
      JPEG: string
      WebP: string
      SVG: string
      PDF: string
      JSON: string
      XML: string
      CSV: string
      SSV: string
    }
    errors: {
      noData: string
      loadKinklist: string
      dataLoading: string
      exportError: string
      tryAgain: string
      unexpectedError: string
      reportIssue: string
      selectionsNeeded: string
      makeSelections: string
    }
    actions: {
      exportAs: string
      tryAgain: string
      reportIssue: string
    }
  }
  import: {
    title: string
    subtitle: string
    heading: string
    methods: {
      file: {
        title: string
        description: string
        button: string
        dropHint: string
      }
      text: {
        title: string
        description: string
        placeholder: string
        button: string
      }
    }
    supportedFormats: string
    formats: {
      json: {
        title: string
        description: string
      }
      xml: {
        title: string
        description: string
      }
      csv: {
        title: string
        description: string
      }
    }
    dragActive: string
    processing: string
    successful: string
    importSuccessful: string
    dataImported: string
    pleaseWait: string
    errors: {
      unsupportedFileType: string
      invalidFormat: string
      importFailed: string
      failedWithMessage: string
    }
    accessibility: {
      selectFile: string
    }
  }
  input: {
    title: string
    category: string
    description: string
    comment: string
    actions: {
      showDescription: string
      addComment: string
      close: string
    }
  }
  comment: {
    title: string
    placeholder: string
    save: string
    delete: string
  }
  name: {
    title: string
    label: string
    placeholder: string
    required: string
  }
  error: {
    title: string
    general: string
    parsing: string
    export: string
    import: string
    network: string
    close: string
  }
  success: {
    export: string
    import: string
    save: string
  }
  accessibility: {
    closeDialog: string
    openMenu: string
    selectOption: string
    toggleOption: string
  }
  loading: {
    default: string
    export: string
    import: string
    save: string
  }
  language: {
    select: string
    en: string
    de: string
  }
  fix: {
    title: string
    description: string
    button: string
    successMessage: string
  }
  kinks: {
    basics: string
    safety: string
    types: string
  }
  comments: {
    addComment: string
    category: string
    field: string
    kink: string
    rating: string
    commentOptional: string
    placeholder: string
    characters: string
    toClose: string
    toSave: string
  }
}

export type SupportedLanguages = 'en' | 'de'

export interface LanguageResource {
  translation: TranslationKeys
}

export interface I18nResources {
  en: LanguageResource
  de: LanguageResource
}

// Type-safe translation key paths
export type TranslationKeyPath =
  | 'app.title'
  | 'app.subtitle'
  | 'navigation.home'
  | 'navigation.edit'
  | 'navigation.export'
  | 'navigation.import'
  | 'navigation.settings'
  | 'common.or'
  | 'common.and'
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.warning'
  | 'theme.toggleDark'
  | 'theme.toggleLight'
  | 'legend.title'
  | 'legend.notEntered'
  | 'legend.favorite'
  | 'legend.like'
  | 'legend.okay'
  | 'legend.maybe'
  | 'legend.no'
  | 'buttons.start'
  | 'buttons.next'
  | 'buttons.previous'
  | 'buttons.save'
  | 'buttons.cancel'
  | 'buttons.close'
  | 'buttons.continue'
  | 'buttons.edit'
  | 'buttons.export'
  | 'buttons.import'
  | 'buttons.delete'
  | 'buttons.confirm'
  | 'buttons.reset'
  | 'buttons.help'
  | 'buttons.focus'
  | 'editor.title'
  | 'editor.placeholder'
  | 'export.title'
  | 'export.subtitle'
  | 'import.title'
  | 'import.subtitle'
  | 'input.title'
  | 'comment.title'
  | 'name.title'
  | 'error.title'
  | 'success.export'
  | 'success.import'
  | 'success.save'
  | 'language.select'
  | 'language.en'
  | 'language.de'
// Add more specific paths as needed

// Module declaration for react-i18next to use our types
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: I18nResources
  }
}
