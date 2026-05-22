/**
 * TreeNode Component
 * Recursive tree node with expand/collapse and indent guide lines
 */

import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder, Zap, Activity, Settings } from 'lucide-react'
import type { TreeNode as TreeNodeType } from '../../lib/buildTree'
import { formatMemberLabel } from '../../lib/memberLabel'

interface TreeNodeProps {
  node: TreeNodeType
  selectedId: string | null
  onSelect: (node: TreeNodeType) => void
  level: number
  /** For each ancestor level, true = that ancestor is the last child (line stops), false = line continues */
  guideLines?: boolean[]
  /** Whether this node is the last child among its siblings */
  isLast?: boolean
}

export function TreeNode({ node, selectedId, onSelect, level, guideLines = [], isLast = true }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false)

  const hasChildren = node.children && node.children.length > 0
  const isSelected = node.id === selectedId

  const getIcon = () => {
    switch (node.type) {
      case 'path':
        return <Folder className="h-3.5 w-3.5 text-blue-400" />
      case 'interface':
        return <File className="h-3.5 w-3.5 text-green-400" />
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
    } else if (node.type === 'path' || node.type === 'interface') {
      onSelect(node)
    }
  }

  // Current node's own guide state: last child → "L" connector, otherwise → line continues
  const currentGuideIsLast = isLast
  // Full guide state array for children: ancestors + current node
  const childGuideLines = [...guideLines, currentGuideIsLast]

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 hover:bg-muted ${
          isSelected ? 'bg-primary/20 text-primary' : ''
        }`}
        onClick={handleClick}
      >
        {/* Guide line columns */}
        {guideLines.length > 0 && (
          <div className="flex shrink-0 self-stretch">
            {guideLines.map((ancestorIsLast, i) => (
              <div
                key={i}
                className="relative w-5 shrink-0"
              >
                {!ancestorIsLast && (
                  <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border" />
                )}
              </div>
            ))}
          </div>
        )}
        {/* Current node connector */}
        {level > 0 && (
          <div className="relative w-5 shrink-0 self-stretch">
            {currentGuideIsLast ? (
              <>
                <div className="absolute left-[9px] top-0 h-1/2 w-px bg-border" />
                <div className="absolute left-[9px] top-1/2 w-[9px] h-px bg-border" />
              </>
            ) : (
              <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border" />
            )}
          </div>
        )}
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
        <span className="truncate text-base">
          {node.type === 'member' && node.member ? formatMemberLabel(node.member) : node.label}
        </span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
              guideLines={childGuideLines}
              isLast={index === node.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
