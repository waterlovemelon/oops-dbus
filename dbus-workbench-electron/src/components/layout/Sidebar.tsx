/**
 * Sidebar Component
 * Left sidebar with service tree and member tree
 */

import { useMemo, useState } from 'react'
import { ServiceTree } from '../explorer/ServiceTree'
import { MemberTree } from '../explorer/MemberTree'
import { useAppStore } from '../../stores/appStore'
import { useServiceExplorer } from '../../hooks/useServiceExplorer'
import { useServiceIntrospection } from '../../hooks/useServiceIntrospection'
import { buildServiceTree } from '../../lib/buildTree'

export function Sidebar() {
  const {
    activeBus,
    selectedServiceId,
    selectedServiceName,
    setSelectedService,
    selectedMemberId,
    setSelectedMember,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'services' | 'members'>('services')

  // Fetch services
  const { data: services = [], isLoading: isLoadingServices } = useServiceExplorer(activeBus)

  // Fetch introspection when service is selected
  const { data: members = [], isLoading: isLoadingMembers } = useServiceIntrospection(
    selectedServiceName,
    activeBus
  )

  const treeNodes = useMemo(
    () => (selectedServiceName ? buildServiceTree(members, selectedServiceName) : []),
    [members, selectedServiceName]
  )
  const objectCount = treeNodes.length

  const handleSelectService = (serviceName: string) => {
    setSelectedService(serviceName, serviceName)
    setActiveTab('members')
  }

  const handleSelectMember = (node: any) => {
    setSelectedMember(node.id, node)
  }

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'services'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Services ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'members'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          disabled={!selectedServiceName}
        >
          Members {selectedServiceName && `(${objectCount})`}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'services' ? (
          isLoadingServices ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Loading services...
            </div>
          ) : (
            <ServiceTree
              services={services}
              selectedServiceId={selectedServiceId}
              onSelectService={handleSelectService}
            />
          )
        ) : isLoadingMembers ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Loading members...
          </div>
        ) : (
          <MemberTree
            nodes={treeNodes}
            selectedMemberId={selectedMemberId}
            onSelectMember={handleSelectMember}
          />
        )}
      </div>
    </div>
  )
}
