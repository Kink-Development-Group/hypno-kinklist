// Injected at build time from package.json (see vite.config.ts)
export const APP_VERSION: string = __APP_VERSION__

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
