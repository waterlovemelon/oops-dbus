/**
 * useMethodInvoker Hook
 * Manages D-Bus method invocation with state tracking
 */

import { useCallback, useState } from 'react'
import { ipcClient } from '../ipc/ipcClient'
import type { DbusMethodResult, InvokeMethodParams } from '../types/electron-api'

export function useMethodInvoker() {
  const [result, setResult] = useState<DbusMethodResult | null>(null)
  const [isInvoking, setIsInvoking] = useState(false)

  const invoke = useCallback(async (params: InvokeMethodParams) => {
    setIsInvoking(true)
    setResult(null)

    try {
      const methodResult = await ipcClient.invokeMethod(params)
      setResult(methodResult)
      return methodResult
    } catch (error) {
      const errorResult: DbusMethodResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
      setResult(errorResult)
      return errorResult
    } finally {
      setIsInvoking(false)
    }
  }, [])

  const clearResult = useCallback(() => {
    setResult(null)
  }, [])

  return {
    invoke,
    result,
    isInvoking,
    clearResult,
  }
}
