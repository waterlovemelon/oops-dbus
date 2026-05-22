/**
 * Sidebar Component
 * Left sidebar with expandable service tree, supporting local and remote sources
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, Search, Wifi, WifiOff } from 'lucide-react'
import { TreeNode } from '../explorer/TreeNode'
import { Input } from '../ui/input'
import { useAppStore } from '../../stores/appStore'
import { useConnectionStore } from '../../stores/connectionStore'
import { ipcClient } from '../../ipc/ipcClient'
import { buildServiceTree } from '../../lib/buildTree'
import type { BusType, DbusMemberInfo, ServiceInfo } from '../../types/electron-api'
import { useQuery } from '@tanstack/react-query'

let statusListenerInitialized = false

function formatRelativeTime(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface RemoteSourceState {
  sessionServices: string[]
  systemServices: string[]
  sessionServiceInfoMap: Record<string, ServiceInfo>
  systemServiceInfoMap: Record<string, ServiceInfo>
  expandedService: string | null
  expandedBusType: BusType | null
  members: DbusMemberInfo[]
  isLoadingSession: boolean
  isLoadingSystem: boolean
  isLoadingMembers: boolean
}

export function Sidebar() {
  const {
    selectedServiceName,
    setSelectedService,
    selectedMemberId,
    setSelectedMember,
    setActiveBus,
    setActiveConnectionId,
  } = useAppStore()

  const { connections, connectionStates, loadConnections, initStatusListener } = useConnectionStore()

  const [filterText, setFilterText] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('local')
  const [busFilter, setBusFilter] = useState<'all' | 'session' | 'system'>('all')
  const [remoteStates, setRemoteStates] = useState<Record<string, RemoteSourceState>>({})

  // Load connections and initialize status listener on mount (only once)
  useEffect(() => {
    loadConnections()
    if (!statusListenerInitialized) {
      statusListenerInitialized = true
      initStatusListener()
    }
  }, [])

  // Local services - fetch both session and system
  const { data: localSessionServices = [], isLoading: isLoadingLocalSession } = useQuery({
    queryKey: ['services', 'session'],
    queryFn: () => ipcClient.listServices('session'),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  })
  const { data: localSystemServices = [], isLoading: isLoadingLocalSystem } = useQuery({
    queryKey: ['services', 'system'],
    queryFn: () => ipcClient.listServices('system'),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  })

  // Fetch service info (unique name, pid, process cmd) for all local services in batch
  const { data: localSessionServiceInfoMap = {} as Record<string, ServiceInfo> } = useQuery({
    queryKey: ['allServiceInfo', 'session'],
    queryFn: () => ipcClient.getAllServiceInfo('session'),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  })
  const { data: localSystemServiceInfoMap = {} as Record<string, ServiceInfo> } = useQuery({
    queryKey: ['allServiceInfo', 'system'],
    queryFn: () => ipcClient.getAllServiceInfo('system'),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  })
  const localServiceInfoMaps = { session: localSessionServiceInfoMap, system: localSystemServiceInfoMap }
  const getServiceInfoLocal = (serviceName: string, busType: BusType) =>
    localServiceInfoMaps[busType]?.[serviceName] ?? null

  const [localExpandedService, setLocalExpandedService] = useState<string | null>(null)
  const [localExpandedBusType, setLocalExpandedBusType] = useState<BusType | null>(null)
  const { data: localMembers = [], isLoading: isLoadingLocalMembers } = useQuery({
    queryKey: ['introspection', localExpandedService, localExpandedBusType],
    queryFn: () => localExpandedService && localExpandedBusType ? ipcClient.introspectServiceMembers(localExpandedService, localExpandedBusType) : Promise.resolve([]),
    enabled: !!localExpandedService && !!localExpandedBusType,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  })

  // Fetch remote services (both session and system) when connections become connected
  const fetchRemoteServices = useCallback(async (connId: string) => {
    setRemoteStates((prev) => ({
      ...prev,
      [connId]: {
        ...prev[connId],
        sessionServices: prev[connId]?.sessionServices || [],
        systemServices: prev[connId]?.systemServices || [],
        sessionServiceInfoMap: prev[connId]?.sessionServiceInfoMap || {},
        systemServiceInfoMap: prev[connId]?.systemServiceInfoMap || {},
        expandedService: prev[connId]?.expandedService || null,
        expandedBusType: prev[connId]?.expandedBusType || null,
        members: prev[connId]?.members || [],
        isLoadingSession: true,
        isLoadingSystem: true,
        isLoadingMembers: false,
      },
    }))

    const fetchBus = async (busType: BusType) => {
      try {
        return await ipcClient.listServices(busType, connId)
      } catch (err) {
        console.error(`Failed to fetch remote ${busType} services for ${connId}:`, err)
        return []
      }
    }

    const [sessionServices, systemServices] = await Promise.all([
      fetchBus('session'),
      fetchBus('system'),
    ])

    setRemoteStates((prev) => ({
      ...prev,
      [connId]: {
        ...prev[connId],
        sessionServices,
        systemServices,
        sessionServiceInfoMap: prev[connId]?.sessionServiceInfoMap || {},
        systemServiceInfoMap: prev[connId]?.systemServiceInfoMap || {},
        expandedService: prev[connId]?.expandedService || null,
        expandedBusType: prev[connId]?.expandedBusType || null,
        members: prev[connId]?.members || [],
        isLoadingSession: false,
        isLoadingSystem: false,
        isLoadingMembers: false,
      },
    }))

    // Fetch service info in the background
    const fetchServiceInfo = async (services: string[], busType: BusType) => {
      const entries = await Promise.all(
        services.map(async (name) => {
          try {
            const info = await ipcClient.getServiceInfo(name, busType, connId)
            return [name, info] as const
          } catch {
            return [name, { serviceName: name, uniqueName: null, pid: null, processCmd: null, isActive: false }] as const
          }
        }),
      )
      return Object.fromEntries(entries) as Record<string, ServiceInfo>
    }

    const [sessionInfoMap, systemInfoMap] = await Promise.all([
      fetchServiceInfo(sessionServices, 'session'),
      fetchServiceInfo(systemServices, 'system'),
    ])

    setRemoteStates((prev) => ({
      ...prev,
      [connId]: {
        ...prev[connId],
        sessionServiceInfoMap: sessionInfoMap,
        systemServiceInfoMap: systemInfoMap,
      },
    }))
  }, [])

  // Track which connections we've already fetched
  const fetchedRef = useRef<Set<string>>(new Set())

  // Watch for connected remote connections and fetch their services
  useEffect(() => {
    for (const conn of connections) {
      const state = connectionStates[conn.id]
      if (state && state.status === 'connected') {
        if (!fetchedRef.current.has(conn.id)) {
          fetchedRef.current.add(conn.id)
          fetchRemoteServices(conn.id)
          // Auto-switch to the newly connected remote source
          setSelectedSource(conn.id)
        }
      } else if (state?.status !== 'connected' && fetchedRef.current.has(conn.id)) {
        fetchedRef.current.delete(conn.id)
        setRemoteStates((prev) => {
          const next = { ...prev }
          delete next[conn.id]
          return next
        })
        // Switch back to local if the active source disconnected
        setSelectedSource((prev) => (prev === conn.id ? 'local' : prev))
      }
    }
  }, [connections, connectionStates, fetchRemoteServices])

  // Filter services for a given list
  const filterServices = (services: string[]) => {
    if (!filterText) return services
    const lowerFilter = filterText.toLowerCase()
    return services.filter((service) => service.toLowerCase().includes(lowerFilter))
  }

  // Handle toggle service (local)
  const handleToggleLocalService = (serviceName: string, busType: BusType) => {
    if (localExpandedService === serviceName && localExpandedBusType === busType) {
      setLocalExpandedService(null)
      setLocalExpandedBusType(null)
    } else {
      setLocalExpandedService(serviceName)
      setLocalExpandedBusType(busType)
      setActiveBus(busType)
      setActiveConnectionId(null) // 清除远程连接
      setSelectedService(serviceName, serviceName)
    }
  }

  // Handle toggle service (remote)
  const handleToggleRemoteService = (connId: string, serviceName: string, busType: BusType) => {
    const current = remoteStates[connId]
    if (current?.expandedService === serviceName && current?.expandedBusType === busType) {
      setRemoteStates((prev) => ({
        ...prev,
        [connId]: { ...prev[connId], expandedService: null, expandedBusType: null, members: [] },
      }))
    } else {
      setRemoteStates((prev) => ({
        ...prev,
        [connId]: { ...prev[connId], expandedService: serviceName, expandedBusType: busType, isLoadingMembers: true },
      }))
      // Fetch members
      ipcClient.introspectServiceMembers(serviceName, busType, connId).then((members) => {
        setRemoteStates((prev) => ({
          ...prev,
          [connId]: { ...prev[connId], members, isLoadingMembers: false },
        }))
      }).catch((err) => {
        console.error(`Failed to introspect remote service ${serviceName}:`, err)
        setRemoteStates((prev) => ({
          ...prev,
          [connId]: { ...prev[connId], members: [], isLoadingMembers: false },
        }))
      })
      setActiveBus(busType)
      setActiveConnectionId(connId) // 设置远程连接 ID
      setSelectedService(serviceName, serviceName)
    }
  }

  const handleSelectMember = (node: any) => {
    setSelectedMember(node.id, node)
  }

  // Render a service group (local or remote)
  const renderServiceGroup = (
    label: string,
    services: string[],
    expandedService: string | null,
    members: DbusMemberInfo[],
    isLoadingServices: boolean,
    isLoadingMembers: boolean,
    onToggleService: (serviceName: string) => void,
    getServiceInfo?: (serviceName: string) => ServiceInfo | null,
    statusIcon?: React.ReactNode,
  ) => {
    const filtered = filterServices(services)

    return (
      <div className="mb-1">
        {/* Group header */}
        <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5">
          {statusIcon}
          <span className="text-sm font-medium text-text-2">{label}</span>
        </div>

        {/* Service list */}
        <div className="py-0.5">
          {isLoadingServices ? (
            <div className="px-2 py-2 text-center text-sm text-text-2">
              加载服务中...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-2 py-2 text-center text-sm text-text-2">
              {services.length === 0 ? '无服务' : '无匹配服务'}
            </div>
          ) : (
            filtered.map((service) => {
              const isExpanded = expandedService === service
              const isSelected = selectedServiceName === service
              const treeNodes = isExpanded ? buildServiceTree(members, service) : []
              const info = getServiceInfo?.(service)

              return (
                <div key={service}>
                  <button
                    onClick={() => onToggleService(service)}
                    className={`flex w-full items-start gap-1 rounded px-2 py-1 text-left transition-colors ${
                      isSelected && !isExpanded
                        ? 'bg-selected-bg text-selected-text'
                        : isExpanded
                          ? 'bg-surface-2 text-text-0'
                          : 'hover:bg-surface-2'
                    }`}
                  >
                    <ChevronRight
                      className={`mt-1 h-3 w-3 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-base">{service}</span>
                      {info && (
                        <div className="mt-0.5 flex items-center gap-1 overflow-hidden">
                          <span
                            className={`inline-block h-[5px] w-[5px] shrink-0 rounded-full ${
                              info.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          {info.isActive ? (
                            <span className="truncate text-[11px] text-text-2">
                              {info.uniqueName}
                              {info.processCmd && ` · ${info.processCmd}`}
                              {info.startTime && ` · ${formatRelativeTime(info.startTime)}`}
                            </span>
                          ) : (
                            <span className="text-[11px] text-text-3">inactive</span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="ml-1">
                      {isLoadingMembers ? (
                        <div className="px-2 py-1 text-sm text-text-2">
                          加载成员中...
                        </div>
                      ) : treeNodes.length > 0 ? (
                        treeNodes.map((node) => (
                          <TreeNode
                            key={node.id}
                            node={node}
                            selectedId={selectedMemberId}
                            onSelect={handleSelectMember}
                            level={2}
                          />
                        ))
                      ) : (
                        <div className="px-2 py-1 text-sm text-text-2">
                          无成员
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  const connectedRemoteConnections = connections.filter(
    (conn) => connectionStates[conn.id]?.status === 'connected'
  )

  // All connections for the dropdown (connected first, then others)
  const allConnections = useMemo(() => {
    const connected = connections.filter((c) => connectionStates[c.id]?.status === 'connected')
    const others = connections.filter((c) => connectionStates[c.id]?.status !== 'connected')
    return [...connected, ...others]
  }, [connections, connectionStates])

  // Determine current source's services and state
  const isLocal = selectedSource === 'local'
  const activeConn = isLocal ? null : connections.find((c) => c.id === selectedSource)
  const connState = activeConn ? connectionStates[activeConn.id] : null
  const isConnected = isLocal || connState?.status === 'connected'

  // Current source's service list + expanded state (for footer count)
  const remoteState = activeConn ? remoteStates[activeConn.id] : null
  const currentServices = (() => {
    if (isLocal) {
      const s = busFilter !== 'system' ? localSessionServices : []
      const sys = busFilter !== 'session' ? localSystemServices : []
      return [...s, ...sys]
    }
    const s = busFilter !== 'system' ? (remoteState?.sessionServices ?? []) : []
    const sys = busFilter !== 'session' ? (remoteState?.systemServices ?? []) : []
    return [...s, ...sys]
  })()

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      {/* Source Selector */}
      <div className="border-b border-border bg-surface-1 p-2">
        {connectedRemoteConnections.length > 0 && (
          <>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="h-7 w-full appearance-none rounded border border-border bg-surface-2 px-2 pr-6 text-sm text-text-0 outline-none focus:border-info"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2371717a'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
              }}
            >
              <optgroup label="本地">
                <option value="local">本地 D-Bus</option>
              </optgroup>
              <optgroup label="远程连接">
                {allConnections.map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name} ({conn.host})
                    </option>
                ))}
              </optgroup>
            </select>
            {/* Remote connection detail */}
            {!isLocal && activeConn && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-text-2">
                <span>{activeConn.user}@{activeConn.host}:{activeConn.port}</span>
                {connState?.status === 'error' && connState.error && (
                  <span className="ml-auto text-[11px] text-error" title={connState.error}>
                    Error
                  </span>
                )}
              </div>
            )}
          </>
        )}
        {/* Bus filter tabs */}
        <div className="mt-1.5 flex gap-0.5 rounded bg-surface-0 p-0.5">
          {([['全部', 'all'], ['Session', 'session'], ['System', 'system']] as const).map(([label, value]) => (
            <button
              key={value}
              onClick={() => setBusFilter(value)}
              className={`flex-1 rounded px-1.5 py-0.5 text-sm transition-colors ${
                busFilter === value
                  ? 'bg-success text-success-foreground font-medium'
                  : 'text-text-2 hover:bg-surface-2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-2" />
          <Input
            type="text"
            placeholder="搜索服务..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-7 pl-7 text-sm"
          />
        </div>
      </div>

      {/* Service List */}
      <div className="flex-1 overflow-y-auto p-1">
        {isConnected ? (
          isLocal ? (
            // Local: show groups based on busFilter
            <>
              {(busFilter === 'all' || busFilter === 'session') && renderServiceGroup(
                'Session',
                localSessionServices,
                localExpandedBusType === 'session' ? localExpandedService : null,
                localExpandedBusType === 'session' ? localMembers : [],
                isLoadingLocalSession,
                localExpandedBusType === 'session' ? isLoadingLocalMembers : false,
                (serviceName) => handleToggleLocalService(serviceName, 'session'),
                (serviceName) => getServiceInfoLocal(serviceName, 'session'),
              )}
              {(busFilter === 'all' || busFilter === 'system') && renderServiceGroup(
                'System',
                localSystemServices,
                localExpandedBusType === 'system' ? localExpandedService : null,
                localExpandedBusType === 'system' ? localMembers : [],
                isLoadingLocalSystem,
                localExpandedBusType === 'system' ? isLoadingLocalMembers : false,
                (serviceName) => handleToggleLocalService(serviceName, 'system'),
                (serviceName) => getServiceInfoLocal(serviceName, 'system'),
              )}
            </>
          ) : (
            // Remote: show groups based on busFilter
            <>
              {(busFilter === 'all' || busFilter === 'session') && renderServiceGroup(
                `${activeConn?.name ?? ''} - Session`,
                remoteState?.sessionServices ?? [],
                remoteState?.expandedBusType === 'session' ? remoteState?.expandedService ?? null : null,
                remoteState?.expandedBusType === 'session' ? remoteState?.members ?? [] : [],
                remoteState?.isLoadingSession ?? true,
                remoteState?.expandedBusType === 'session' ? (remoteState?.isLoadingMembers ?? false) : false,
                (serviceName) => activeConn && handleToggleRemoteService(activeConn.id, serviceName, 'session'),
                (serviceName) => remoteState?.sessionServiceInfoMap?.[serviceName] ?? null,
                <Wifi className="h-3 w-3 text-success" />,
              )}
              {(busFilter === 'all' || busFilter === 'system') && renderServiceGroup(
                `${activeConn?.name ?? ''} - System`,
                remoteState?.systemServices ?? [],
                remoteState?.expandedBusType === 'system' ? remoteState?.expandedService ?? null : null,
                remoteState?.expandedBusType === 'system' ? remoteState?.members ?? [] : [],
                remoteState?.isLoadingSystem ?? true,
                remoteState?.expandedBusType === 'system' ? (remoteState?.isLoadingMembers ?? false) : false,
                (serviceName) => activeConn && handleToggleRemoteService(activeConn.id, serviceName, 'system'),
                (serviceName) => remoteState?.systemServiceInfoMap?.[serviceName] ?? null,
                <Wifi className="h-3 w-3 text-[#c586c0]" />,
              )}
            </>
          )
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            {connState?.status === 'connecting' ? (
              <>
                <Wifi className="h-5 w-5 text-warning" />
                <span className="text-sm text-text-2">连接中...</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-text-3" />
                <span className="text-sm text-text-2">未连接</span>
                <span className="text-sm text-text-3">通过远程连接菜单连接</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-2 py-1 text-sm text-text-2">
        {isConnected ? (
          <>
            {currentServices.length} 服务
            {isLocal && connectedRemoteConnections.length > 0 &&
              ` · ${connectedRemoteConnections.length} 个远程连接`}
          </>
        ) : (
          <span>未连接</span>
        )}
      </div>
    </div>
  )
}
