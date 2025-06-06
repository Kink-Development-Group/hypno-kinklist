# KinkList Editor Documentation

## Overview

The KinkList Editor is an enterprise-ready code editor specifically designed for creating and editing kink list templates. It replaces the simple textarea with a sophisticated Monaco Editor-based solution that provides syntax highlighting, code completion, validation, and many advanced features.

## Features

### 🎨 Syntax Highlighting

- **Categories**: Lines starting with `#` are highlighted as categories
- **Fields**: Lines with `(field1, field2)` format are highlighted as field definitions
- **Kinks**: Lines starting with `*` are highlighted as kink entries
- **Descriptions**: Lines starting with `?` are highlighted as descriptions
- **Comments**: Lines starting with `//` are treated as comments

### 🔧 Advanced Editor Features

- **Code Completion**: Press `Ctrl+K` for intelligent autocomplete suggestions
- **Snippets**: Pre-built templates for common kink list patterns
- **Formatting**: Automatic code formatting with `Alt+Shift+F`
- **Validation**: Real-time syntax validation with error highlighting
- **Dark/Light Theme**: Automatic theme detection with manual override

### 📋 Snippet Library

The editor includes a comprehensive snippet library:

#### Category Snippets

- **Neue Kategorie**: Complete category with fields and a kink
- **Einfache Kategorie**: Simple category with one field
- **Kategorie mit mehreren Feldern**: Category with multiple rating fields

#### Kink Snippets

- **Neuer Kink**: Simple kink without description
- **Kink mit Beschreibung**: Kink with detailed description

#### Template Snippets

- **Komplette BDSM-Vorlage**: Comprehensive BDSM-oriented template
- **Basis-Vorlage**: Simple starter template with placeholders

### 🎯 Editor Toolbar

The toolbar provides quick access to common functionality:

- **Format**: Format the entire document
- **Snippets**: Insert pre-built code snippets
- **Help**: View syntax documentation
- **Focus**: Return focus to the editor

### ⌨️ Keyboard Shortcuts

- `Ctrl+K`: Trigger autocomplete
- `Alt+Shift+F`: Format code
- `Ctrl+Enter`: Save and close editor
- `Esc`: Close editor without saving

## Usage

### Basic Syntax

```bash
# Category Name
(Field1, Field2, Field3)
*Kink Name
?Optional description for the kink

// This is a comment
```

### Example Template

```bash
#Bondage
(Sub, Dom, Giving, Receiving)
*Rope Bondage
?Restraint using ropes in various techniques
*Handcuffs
?Metal or soft restraints for wrists
*Blindfold
?Sensory deprivation through sight restriction

#Impact Play
(Sub, Dom, Giving, Receiving)
*Spanking
?Striking with hands on various body parts
*Paddle
?Striking with a flat tool
*Flogger
?Whip with multiple tails
```

### Field Definitions

Common field patterns:

- `(Sub, Dom, Giving, Receiving)` - For role-based activities
- `(Interested, Experienced, Limits)` - For experience levels
- `(Like, Dislike, Maybe)` - For preferences
- `(Soft Limit, Hard Limit, No Limit)` - For boundaries

## Technical Details

### Architecture

- **Monaco Editor**: Microsoft's VS Code editor engine
- **Custom Language**: `kinklist` language definition with tokenizer
- **TypeScript**: Fully typed with comprehensive interfaces
- **React**: Modern functional components with hooks
- **SCSS**: Modular styling with theme support

### Files Structure

```bash
src/components/editor/
├── KinkListEditor.tsx      # Main editor component
├── EditorToolbar.tsx       # Toolbar with snippets and tools
├── KinkListLanguage.ts     # Language definition and themes
└── EditorUtils.ts          # Snippets and utility functions

src/styles/
└── _editor.scss           # Editor-specific styles
```

### Integration

The editor is integrated into the `EditOverlay` component, replacing the simple textarea. It maintains backward compatibility with the existing parsing logic in `utils/index.ts`.

## Validation

The editor provides real-time validation:

- **Syntax Errors**: Invalid line formats
- **Naming Issues**: Empty category or kink names
- **Structure Warnings**: Fields defined after kinks
- **Best Practices**: Recommendations for better formatting

## Accessibility

The editor maintains full accessibility support:

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and focus handling
- **High Contrast**: Support for high contrast themes

## Performance

- **Lazy Loading**: Monaco Editor is loaded only when needed
- **Efficient Rendering**: Virtual scrolling for large documents
- **Memory Management**: Proper cleanup of editor instances
- **Background Processing**: Non-blocking validation and formatting

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

When extending the editor:

1. Add new snippets to `EditorUtils.ts`
2. Update language definition in `KinkListLanguage.ts` for new syntax
3. Add corresponding styles to `_editor.scss`
4. Update validation logic if needed
5. Test across different browsers and themes

## Future Enhancements

Planned features:

- **Live Preview**: Real-time preview of parsed kink list
- **Import/Export**: Support for various file formats
- **Collaborative Editing**: Multi-user editing capabilities
- **Plugin System**: Extensible architecture for custom features
- **Mobile Optimization**: Enhanced mobile editing experience
