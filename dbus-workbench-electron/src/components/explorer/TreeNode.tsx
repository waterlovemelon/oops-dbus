/**
 * TreeNode Component
 * Recursive tree node with expand/collapse functionality
 */

import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder, Zap, Activity, Settings } from 'lucide-react'
import type { TreeNode as TreeNodeType } from '../../lib/buildTree'

interface TreeNodeProps {
  node: TreeNodeType
  selectedId: string | null
  onSelect: (node: TreeNodeType) => void
  level: number
}

export function TreeNode({ node, selectedId, onSelect, level }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false)

  const hasChildren = node.children && node.children.length > 0
  const isSelected = node.id === selectedId

  const getIcon = () => {
    switch (node.type) {
      case 'path':
        return <Folder className="h-3.5 w-3.5 text-blue-400" />
      case 'interface':
        return <File className="h-3.5 w-3.5 text-green-400" />
      case 'category':
        if (node.label === 'Methods') return <Zap className="h-3.5 w-3.5 text-yellow-400" />
        if (node.label === 'Signals') return <Activity className="h-3.5 w-3.5 text-purple-400" />
        return <Settings className="h-3.5 w-3.5 text-cyan-400" />
      case 'member':
        return node.member?.type === 'method' ? (
          <Zap className="h-3.5 w-3.5 text-yellow-400" />
        ) : node.member?.type === 'signal' ? (
          <Activity className="h-3.5 w-3.5 text-purple-400" />
        ) : (
          <Settings className="h-3.5 w-3.5 text-cyan-400" />
        )
      default:
        return <File className="h-3.5 w-3.5" />
    }
  }

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded)
    }
    if (node.type === 'member' && node.member) {
      onSelect(node)
    }
  }

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 hover:bg-muted ${
          isSelected ? 'bg-primary/20 text-primary' : ''
        }`}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" />
          )
        ) : (
          <span className="w-3" />
        )}
        {getIcon()}
        <span className="truncate text-xs">{node.label}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
