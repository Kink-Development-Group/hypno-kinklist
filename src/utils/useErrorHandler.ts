import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import ErrorModal from '../components/ErrorModal'
import { reportError } from './index'

interface ErrorContextType {
  reportAppError: (message: string, error?: unknown) => void
  dismissAppError: () => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export const AppErrorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [message, setMessage] = useState<string | null>(null)

  const dismissAppError = useCallback(() => {
    setMessage(null)
  }, [])

  const reportAppError = useCallback((nextMessage: string, error?: unknown) => {
    if (typeof error !== 'undefined') {
      reportError(nextMessage, error)
    }

    setMessage(nextMessage)
  }, [])

  const contextValue = useMemo<ErrorContextType>(
    () => ({
      reportAppError,
      dismissAppError,
    }),
    [dismissAppError, reportAppError]
  )

  return React.createElement(
    ErrorContext.Provider,
    { value: contextValue },
    children,
    message
      ? React.createElement(ErrorModal, {
          message,
          onClose: dismissAppError,
        })
      : null
  )
}

export type ErrorHandler = (message: string, error?: unknown) => void

export function useErrorHandler(): ErrorHandler {
  const context = useContext(ErrorContext)

  return useCallback(
    (message: string, error?: unknown) => {
      if (context) {
        context.reportAppError(message, error)
        return
      }

      if (typeof error !== 'undefined') {
        reportError(message, error)
      }

      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(message)
      }
    },
    [context]
  )
}
