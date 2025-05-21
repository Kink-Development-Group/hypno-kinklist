# Neo-Kinklist

Eine moderne React/TypeScript-Implementierung der ursprünglichen Kinklist-Anwendung, mit verbesserter Codebasis und erweiterter Funktionalität.

## Übersicht

Dieses Projekt ist eine 1:1-Übersetzung des ursprünglichen jQuery-basierten Kinklist zu einer modernen React/TypeScript-Anwendung. Es behält alle ursprünglichen Funktionen bei, während es moderne Web-Entwicklungspraktiken einsetzt.

## Funktionen

- Vollständig typisiert mit TypeScript
- Reaktive Komponenten mit React
- State-Management mit React Context API
- Styling mit SASS
- Performanceoptimierung mit Code-Splitting und Tree-Shaking
- Export-Funktionalität mit Imgur-Integration
- Hash-basierte URL-Freigabe von Selektionen

## Projektstruktur

- `src/components/`: React-Komponenten
  - `Choice.tsx`: Auswahloption für einen Kink
  - `EditOverlay.tsx`: Overlay zum Bearbeiten der Kink-Liste
  - `Export.tsx`: Exportfunktionalität für die Kink-Liste
  - `InputList.tsx`: Hauptkomponente zur Anzeige der Kategorien und Kinks
  - `InputOverlay.tsx`: Overlay zur sequentiellen Navigation durch Kinks
  - `KinkCategory.tsx`: Komponente zur Darstellung einer Kink-Kategorie
  - `KinkRow.tsx`: Komponente zur Darstellung einer Kink-Zeile
  - `Legend.tsx`: Legende für die Auswahl-Level
- `src/context/`: React Context für State-Management
  - `KinklistContext.tsx`: Zentraler State und Logik
- `src/styles/`: SASS-Styling
  - `main.scss`: Hauptstildatei
- `src/types/`: TypeScript-Typdefinitionen
  - `index.ts`: Typen für Kinks, Kategorien und Auswahloptionen
- `src/utils/`: Hilfsfunktionen
  - `index.ts`: Utilities für Parsing, Hash-Kodierung/Dekodierung und Export

## Installation

```
npm install
```

## Entwicklung

```
npm start
```

## Build für Produktion

```
npm run build
```

## Build mit Bundle-Analyse

```
npm run build:analyze
```

## Technologie-Stack

- React 19
- TypeScript 4
- SASS für Styling
- Axios für HTTP-Anfragen
- html2canvas für Bilderfassung
- Craco für erweiterte Webpack-Konfiguration

## Verbesserungen gegenüber dem Original

1. **Bessere Wartbarkeit**: Durch die Verwendung von React-Komponenten und TypeScript ist der Code modular und typsicher.
2. **Verbesserte Performance**: Moderne Webpack-Optimierungen und Code-Splitting.
3. **Bessere Benutzerfreundlichkeit**: Verbesserte Tastaturnavigation und Zugänglichkeit.
4. **Robustere Fehlerbehandlung**: Erweiterte Validierung und Fehlerberichterstattung.
5. **Responsive Design**: Bessere Unterstützung für verschiedene Bildschirmgrößen.

## Zukünftige Erweiterungen

- Integration von i18n für mehrsprachige Unterstützung
- Speichern von Konfigurationen in LocalStorage/IndexedDB
- Alternative Export-Optionen (PDF, JSON)
- Theme-Unterstützung mit wechselbaren Farbschemen
- Progressive Web App (PWA) Funktionalität

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
