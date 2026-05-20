/**
 * usePropertyAccessor Hook
 * Manages D-Bus property get/set operations with state tracking
 */

import { useCallback, useState } from 'react'
import { ipcClient } from '../ipc/ipcClient'
import type {
  DbusMethodResult,
  GetPropertyParams,
  SetPropertyParams,
} from '../types/electron-api'

export function usePropertyAccessor() {
  const [value, setValue] = useState<DbusMethodResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getProperty = useCallback(async (params: GetPropertyParams) => {
    setIsLoading(true)
    setError(null)
    setValue(null)

    try {
      const result = await ipcClient.getProperty(params)
      setValue(result)
      if (!result.success) {
        setError(result.error || 'Failed to get property')
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      const errorResult: DbusMethodResult = { success: false, error: message }
      setValue(errorResult)
      return errorResult
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setProperty = useCallback(async (params: SetPropertyParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await ipcClient.setProperty(params)
      if (!result.success) {
        setError(result.error || 'Failed to set property')
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      const errorResult: DbusMethodResult = { success: false, error: message }
      return errorResult
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearValue = useCallback(() => {
    setValue(null)
    setError(null)
  }, [])

  return {
    getProperty,
    setProperty,
    clearValue,
    value,
    isLoading,
    error,
  }
}
