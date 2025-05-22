# Neo-Kinklist

A modern React/TypeScript implementation of the original Kinklist application, with an improved codebase and enhanced functionality.

## Overview

This project is a 1:1 translation of the original jQuery-based Kinklist to a modern React/TypeScript application. It retains all of the original features while utilizing modern web development practices.

## Features

- Fully typed with TypeScript
- Reactive components with React
- State management with React Context API
- Styling with SASS
- Performance optimization with code splitting and tree shaking
- Export functionality with Imgur integration
- Hash-based URL sharing of selections

## Project Structure

- `src/components/`: React components
  - `Choice.tsx`: Choice option for a kink
  - `EditOverlay.tsx`: Overlay for editing the kink list
  - `Export.tsx`: Export functionality for the kink list
  - `InputList.tsx`: Main component for displaying categories and kinks
  - `InputOverlay.tsx`: Overlay for sequential navigation through kinks
  - `KinkCategory.tsx`: Component for displaying a kink category
  - `KinkRow.tsx`: Component for displaying a kink row
  - `Legend.tsx`: Legend for the selection levels
- `src/context/`: React Context for state management
  - `KinklistContext.tsx`: Central state and logic
- `src/styles/`: SASS styling
  - `main.scss`: Main style file
- `src/types/`: TypeScript type definitions
  - `index.ts`: Types for kinks, categories, and selection options
- `src/utils/`: Utility functions
  - `index.ts`: Utilities for parsing, hash encoding/decoding, and export

## Installation

```bash
npm install
```

## Development

```bash
npm start
```

Starts the development server at [http://localhost:3000](http://localhost:3000).

## Build for Production

```bash
npm run build
```

## Run Tests

```bash
npm test
```

## Technology Stack

- React 18
- TypeScript 4
- SASS for styling
- Axios for HTTP requests
- html2canvas for image capturing

## Improvements over the Original

1. **Better Maintainability**: By using React components and TypeScript, the code is modular and type-safe.
2. **Improved Performance**: Modern Webpack optimizations and code splitting.
3. **Better Usability**: Enhanced keyboard navigation and accessibility.
4. **Robustere Fehlerbehandlung**: Erweiterte Validierung und Fehlerberichterstattung.
5. **Responsive Design**: Better support for different screen sizes.

## Future Enhancements

- Integration of i18n for multilingual support
- Storing configurations in LocalStorage/IndexedDB
- Alternative export options (PDF, JSON)
- Theme support with switchable color schemes
- Progressive Web App (PWA) functionality

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
