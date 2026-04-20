/**
 * useServiceIntrospection Hook
 * Manages D-Bus service introspection using React Query
 */

import { useQuery } from '@tanstack/react-query'
import { ipcClient } from '../ipc/ipcClient'
import type { BusType, DbusMemberInfo } from '../types/electron-api'

export function useServiceIntrospection(serviceName: string | null, busType: BusType) {
  return useQuery<DbusMemberInfo[]>({
    queryKey: ['introspection', serviceName, busType],
    queryFn: () => {
      if (!serviceName) {
        return Promise.resolve([])
      }
      return ipcClient.introspectServiceMembers(serviceName, busType)
    },
    enabled: !!serviceName, // Only run query if serviceName is provided
    staleTime: 60000, // Consider introspection data fresh for 60 seconds
    refetchOnWindowFocus: false,
  })
}
