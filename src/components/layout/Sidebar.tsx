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
import type { BusType, DbusMemberInfo } from '../../types/electron-api'
import { useQuery } from '@tanstack/react-query'

let statusListenerInitialized = false

interface SourceState {
  services: string[]
  expandedService: string | null
  members: DbusMemberInfo[]
  isLoadingServices: boolean
  isLoadingMembers: boolean
}

export function Sidebar() {
  const {
    activeBus,
    selectedServiceName,
    setSelectedService,
    selectedMemberId,
    setSelectedMember,
  } = useAppStore()

  const { connections, connectionStates, loadConnections, initStatusListener } = useConnectionStore()

  const [filterText, setFilterText] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('local')
  const [remoteStates, setRemoteStates] = useState<Record<string, SourceState>>({})

  // Load connections and initialize status listener on mount (only once)
  useEffect(() => {
    loadConnections()
    if (!statusListenerInitialized) {
      statusListenerInitialized = true
      initStatusListener()
    }
  }, [])

  // Local services
  const { data: localServices = [], isLoading: isLoadingLocalServices } = useQuery({
    queryKey: ['services', activeBus],
    queryFn: () => ipcClient.listServices(activeBus),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  })

  const [localExpandedService, setLocalExpandedService] = useState<string | null>(null)
  const { data: localMembers = [], isLoading: isLoadingLocalMembers } = useQuery({
    queryKey: ['introspection', localExpandedService, activeBus],
    queryFn: () => localExpandedService ? ipcClient.introspectServiceMembers(localExpandedService, activeBus) : Promise.resolve([]),
    enabled: !!localExpandedService,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  })

  // Fetch remote services when connections become connected
  const fetchRemoteServices = useCallback(async (connId: string, busType: BusType) => {
    setRemoteStates((prev) => ({
      ...prev,
      [connId]: {
        ...prev[connId],
        services: prev[connId]?.services || [],
        expandedService: prev[connId]?.expandedService || null,
        members: prev[connId]?.members || [],
        isLoadingServices: true,
        isLoadingMembers: false,
      },
    }))

    try {
      const services = await ipcClient.listServices(busType, connId)
      setRemoteStates((prev) => ({
        ...prev,
        [connId]: {
          ...prev[connId],
          services,
          expandedService: prev[connId]?.expandedService || null,
          members: prev[connId]?.members || [],
          isLoadingServices: false,
          isLoadingMembers: false,
        },
      }))
    } catch (err) {
      console.error(`Failed to fetch remote services for ${connId}:`, err)
      setRemoteStates((prev) => ({
        ...prev,
        [connId]: {
          ...prev[connId],
          services: [],
          expandedService: null,
          members: [],
          isLoadingServices: false,
          isLoadingMembers: false,
        },
      }))
    }
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
          fetchRemoteServices(conn.id, conn.busType)
        }
      } else if (state?.status !== 'connected' && fetchedRef.current.has(conn.id)) {
        fetchedRef.current.delete(conn.id)
        setRemoteStates((prev) => {
          const next = { ...prev }
          delete next[conn.id]
          return next
        })
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
  const handleToggleLocalService = (serviceName: string) => {
    if (localExpandedService === serviceName) {
      setLocalExpandedService(null)
    } else {
      setLocalExpandedService(serviceName)
      setSelectedService(serviceName, serviceName)
    }
  }

  // Handle toggle service (remote)
  const handleToggleRemoteService = (connId: string, serviceName: string, busType: BusType) => {
    const current = remoteStates[connId]
    if (current?.expandedService === serviceName) {
      setRemoteStates((prev) => ({
        ...prev,
        [connId]: { ...prev[connId], expandedService: null, members: [] },
      }))
    } else {
      setRemoteStates((prev) => ({
        ...prev,
        [connId]: { ...prev[connId], expandedService: serviceName, isLoadingMembers: true },
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
    statusIcon?: React.ReactNode,
  ) => {
    const filtered = filterServices(services)

    return (
      <div className="mb-1">
        {/* Group header */}
        <div className="flex items-center gap-1.5 border-b border-[#3e3e3e] px-2 py-1.5">
          {statusIcon}
          <span className="text-[11px] font-medium text-[#858585]">{label}</span>
        </div>

        {/* Service list */}
        <div className="py-0.5">
          {isLoadingServices ? (
            <div className="px-2 py-2 text-center text-[11px] text-[#858585]">
              加载服务中...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-2 py-2 text-center text-[11px] text-[#858585]">
              {services.length === 0 ? '无服务' : '无匹配服务'}
            </div>
          ) : (
            filtered.map((service) => {
              const isExpanded = expandedService === service
              const isSelected = selectedServiceName === service
              const treeNodes = isExpanded ? buildServiceTree(members, service) : []

              return (
                <div key={service}>
                  <button
                    onClick={() => onToggleService(service)}
                    className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs transition-colors ${
                      isSelected && !isExpanded
                        ? 'bg-[#094771] text-[#cccccc]'
                        : isExpanded
                          ? 'bg-[#2d2d2d] text-[#cccccc]'
                          : 'hover:bg-[#2d2d2d]'
                    }`}
                  >
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                    <span className="truncate font-mono">{service}</span>
                  </button>

                  {isExpanded && (
                    <div className="ml-1">
                      {isLoadingMembers ? (
                        <div className="px-2 py-1 text-[11px] text-[#858585]">
                          加载成员中...
                        </div>
                      ) : treeNodes.length > 0 ? (
                        treeNodes.map((node) => (
                          <TreeNode
                            key={node.id}
                            node={node}
                            selectedId={selectedMemberId}
                            onSelect={handleSelectMember}
                            level={0}
                          />
                        ))
                      ) : (
                        <div className="px-2 py-1 text-[11px] text-[#858585]">
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

  // Current source info for the dropdown detail line
  const sourceInfoText = isLocal
    ? `${activeBus === 'session' ? 'Session' : 'System'} Bus`
    : activeConn
      ? `${activeConn.user}@${activeConn.host}:${activeConn.port}`
      : ''
  const sourceStatus: 'green' | 'gray' | 'red' | 'yellow' = isLocal
    ? 'green'
    : connState?.status === 'connected'
      ? 'green'
      : connState?.status === 'connecting'
        ? 'yellow'
        : connState?.status === 'error'
          ? 'red'
          : 'gray'

  // Current source's service list + expanded state
  const currentServices = isLocal ? localServices : (remoteStates[activeConn?.id ?? '']?.services ?? [])
  const currentExpanded = isLocal ? localExpandedService : (remoteStates[activeConn?.id ?? '']?.expandedService ?? null)
  const currentMembers = isLocal ? localMembers : (remoteStates[activeConn?.id ?? '']?.members ?? [])
  const currentIsLoadingServices = isLocal ? isLoadingLocalServices : (remoteStates[activeConn?.id ?? '']?.isLoadingServices ?? true)
  const currentIsLoadingMembers = isLocal ? isLoadingLocalMembers : (remoteStates[activeConn?.id ?? '']?.isLoadingMembers ?? false)

  const handleToggleCurrentService = (serviceName: string) => {
    if (isLocal) {
      handleToggleLocalService(serviceName)
    } else if (activeConn) {
      handleToggleRemoteService(activeConn.id, serviceName, activeConn.busType)
    }
  }

  return (
    <div className="flex h-full flex-col border-r border-[#3e3e3e] bg-[#1e1e1e]">
      {/* Source Selector Dropdown */}
      <div className="border-b border-[#3e3e3e] bg-[#252526] p-2">
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="h-7 w-full appearance-none rounded border border-[#3e3e3e] bg-[#2d2d2d] px-2 pr-6 text-xs text-[#cccccc] outline-none focus:border-[#4ec9b0]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23858585'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          <optgroup label="本地">
            <option value="local">
              {activeBus === 'session' ? 'Session' : 'System'} Bus
            </option>
          </optgroup>
          {allConnections.length > 0 && (
            <optgroup label="远程连接">
              {allConnections.map((conn) => {
                const state = connectionStates[conn.id]
                const dot = state?.status === 'connected' ? '● ' : state?.status === 'connecting' ? '○ ' : '○ '
                return (
                  <option key={conn.id} value={conn.id}>
                    {dot}{conn.name} ({conn.host})
                  </option>
                )
              })}
            </optgroup>
          )}
        </select>
        {/* Source detail line */}
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#858585]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              sourceStatus === 'green'
                ? 'bg-[#4ec9b0]'
                : sourceStatus === 'red'
                  ? 'bg-[#f44747]'
                  : sourceStatus === 'yellow'
                    ? 'bg-[#e5c07b]'
                    : 'bg-[#555]'
            }`}
          />
          <span>{sourceInfoText}</span>
          {!isLocal && connState?.status === 'error' && connState.error && (
            <span className="ml-auto text-[10px] text-[#f44747]" title={connState.error}>
              Error
            </span>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-[#3e3e3e] p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#858585]" />
          <Input
            type="text"
            placeholder="搜索服务..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Service List */}
      <div className="flex-1 overflow-y-auto p-1">
        {isConnected ? (
          renderServiceGroup(
            isLocal
              ? `本地 (${activeBus === 'session' ? 'Session' : 'System'})`
              : activeConn?.name ?? '',
            currentServices,
            currentExpanded,
            currentMembers,
            currentIsLoadingServices,
            currentIsLoadingMembers,
            handleToggleCurrentService,
            isLocal ? (
              <span className="h-2 w-2 rounded-full bg-[#4ec9b0]" />
            ) : (
              <Wifi className="h-3 w-3 text-[#4ec9b0]" />
            ),
          )
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            {connState?.status === 'connecting' ? (
              <>
                <Wifi className="h-5 w-5 text-[#e5c07b]" />
                <span className="text-xs text-[#858585]">连接中...</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-[#555]" />
                <span className="text-xs text-[#858585]">未连接</span>
                <span className="text-[11px] text-[#3e3e3e]">通过远程连接菜单连接</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#3e3e3e] px-2 py-1 text-[11px] text-[#858585]">
        {isConnected ? (
          <>
            {filterServices(currentServices).length} / {currentServices.length} 服务
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
