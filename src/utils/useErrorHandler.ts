import { useCallback } from 'react'

export type ErrorHandler = (message: string, error?: unknown) => void

export function useErrorHandler(): ErrorHandler {
  return useCallback((message: string, error?: unknown) => {
    // Hier kann später Logging, Toast, Sentry etc. ergänzt werden
    // window.alert ist Fallback
    if (error) {
      // eslint-disable-next-line no-console
      console.error(message, error)
    }
    window.alert(message)
  }, [])
}
