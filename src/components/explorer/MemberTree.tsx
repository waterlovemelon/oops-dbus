/**
 * MemberTree Component
 * Displays hierarchical tree of service members (methods, signals, properties)
 */

import { TreeNode } from './TreeNode'
import type { TreeNode as TreeNodeType } from '../../lib/buildTree'

interface MemberTreeProps {
  nodes: TreeNodeType[]
  selectedMemberId: string | null
  onSelectMember: (node: TreeNodeType) => void
}

export function MemberTree({ nodes, selectedMemberId, onSelectMember }: MemberTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Select a service to view members
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-2">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          selectedId={selectedMemberId}
          onSelect={onSelectMember}
          level={0}
        />
      ))}
    </div>
  )
}
