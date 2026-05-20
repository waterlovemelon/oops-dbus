/**
 * Sidebar Component
 * Left sidebar with expandable service tree
 */

import { useMemo, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { TreeNode } from '../explorer/TreeNode'
import { Input } from '../ui/input'
import { useAppStore } from '../../stores/appStore'
import { useServiceExplorer } from '../../hooks/useServiceExplorer'
import { useServiceIntrospection } from '../../hooks/useServiceIntrospection'
import { buildServiceTree } from '../../lib/buildTree'

export function Sidebar() {
  const {
    activeBus,
    selectedServiceName,
    setSelectedService,
    selectedMemberId,
    setSelectedMember,
  } = useAppStore()

  const [expandedService, setExpandedService] = useState<string | null>(null)
  const [filterText, setFilterText] = useState('')

  // Fetch services
  const { data: services = [], isLoading: isLoadingServices } = useServiceExplorer(activeBus)

  // Fetch introspection when service is expanded
  const { data: members = [], isLoading: isLoadingMembers } = useServiceIntrospection(
    expandedService,
    activeBus
  )

  const treeNodes = useMemo(
    () => (expandedService ? buildServiceTree(members, expandedService) : []),
    [members, expandedService]
  )

  const filteredServices = useMemo(() => {
    if (!filterText) return services
    const lowerFilter = filterText.toLowerCase()
    return services.filter((service) =>
      service.toLowerCase().includes(lowerFilter)
    )
  }, [services, filterText])

  const handleToggleService = (serviceName: string) => {
    if (expandedService === serviceName) {
      setExpandedService(null)
    } else {
      setExpandedService(serviceName)
      setSelectedService(serviceName, serviceName)
    }
  }

  const handleSelectMember = (node: any) => {
    setSelectedMember(node.id, node)
  }

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      {/* Search Bar */}
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter services..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Service Tree */}
      <div className="flex-1 overflow-y-auto p-1">
        {isLoadingServices ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Loading services...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {services.length === 0 ? 'No services found' : 'No matching services'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredServices.map((service) => {
              const isExpanded = expandedService === service
              const isSelected = selectedServiceName === service

              return (
                <div key={service}>
                  {/* Service Item */}
                  <button
                    onClick={() => handleToggleService(service)}
                    className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs transition-colors ${
                      isSelected && !isExpanded
                        ? 'bg-muted text-foreground'
                        : 'hover:bg-muted'
                    } ${isExpanded ? 'bg-muted text-foreground' : ''}`}
                  >
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="truncate font-mono">{service}</span>
                  </button>

                  {/* Expanded Members Tree */}
                  {isExpanded && (
                    <div className="ml-1">
                      {isLoadingMembers ? (
                        <div className="px-2 py-1 text-xs text-muted-foreground">
                          Loading members...
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
                        <div className="px-2 py-1 text-xs text-muted-foreground">
                          No members found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-2 py-1 text-xs text-muted-foreground">
        {filteredServices.length} of {services.length} services
      </div>
    </div>
  )
}
