// Version direkt aus package.json importieren (funktioniert mit Vite, nicht mit Create React App)
// Achtung: Der Importpfad kann je nach Build-Tool variieren
// Bei Vite: "resolve.alias" in vite.config.ts ggf. anpassen
import pkg from '../../package.json'

export const APP_VERSION = pkg.version as string

export function getAppVersion(): string {
  return APP_VERSION
}

export function getAppVersionParts(): {
  major: number
  minor: number
  patch: number
} {
  const [major, minor, patch] = APP_VERSION.split('.').map(Number)
  return { major, minor, patch }
}
