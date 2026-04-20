/**
 * useServiceExplorer Hook
 * Manages D-Bus service discovery using React Query
 */

import { useQuery } from '@tanstack/react-query'
import { ipcClient } from '../ipc/ipcClient'
import type { BusType } from '../types/electron-api'

export function useServiceExplorer(busType: BusType) {
  return useQuery({
    queryKey: ['services', busType],
    queryFn: () => ipcClient.listServices(busType),
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
  })
}
