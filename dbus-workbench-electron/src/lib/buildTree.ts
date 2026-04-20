/**
 * Build Service Tree
 * Constructs a hierarchical tree structure from flat D-Bus member data
 */

import type { DbusMemberInfo } from '../types/electron-api'

export interface TreeNode {
  id: string
  label: string
  type: 'service' | 'path' | 'interface' | 'category' | 'member'
  children?: TreeNode[]
  member?: DbusMemberInfo
}

/**
 * Build a hierarchical tree from flat member list
 * Structure: Service → Path → Interface → Category (Methods/Signals/Properties) → Member
 */
export function buildServiceTree(members: DbusMemberInfo[], _serviceName: string): TreeNode[] {
  const pathMap = new Map<string, Map<string, Map<string, DbusMemberInfo[]>>>()

  // Group members by path → interface → type
  members.forEach((member) => {
    if (!pathMap.has(member.path)) {
      pathMap.set(member.path, new Map())
    }
    const interfaceMap = pathMap.get(member.path)!

    if (!interfaceMap.has(member.interfaceName)) {
      interfaceMap.set(member.interfaceName, new Map())
    }
    const typeMap = interfaceMap.get(member.interfaceName)!

    const typeKey = member.type
    if (!typeMap.has(typeKey)) {
      typeMap.set(typeKey, [])
    }
    typeMap.get(typeKey)!.push(member)
  })

  // Build tree structure
  const treeNodes: TreeNode[] = []

  pathMap.forEach((interfaceMap, path) => {
    const pathNode: TreeNode = {
      id: `path-${path}`,
      label: path,
      type: 'path',
      children: [],
    }

    interfaceMap.forEach((typeMap, interfaceName) => {
      const interfaceNode: TreeNode = {
        id: `interface-${path}-${interfaceName}`,
        label: interfaceName,
        type: 'interface',
        children: [],
      }

      // Add category nodes (Methods, Signals, Properties)
      const categories = ['method', 'signal', 'property'] as const
      categories.forEach((category) => {
        const members = typeMap.get(category)
        if (members && members.length > 0) {
          const categoryNode: TreeNode = {
            id: `category-${path}-${interfaceName}-${category}`,
            label: category === 'method' ? 'Methods' : category === 'signal' ? 'Signals' : 'Properties',
            type: 'category',
            children: members.map((member) => ({
              id: member.id,
              label: member.name,
              type: 'member',
              member,
            })),
          }
          interfaceNode.children!.push(categoryNode)
        }
      })

      pathNode.children!.push(interfaceNode)
    })

    treeNodes.push(pathNode)
  })

  // Sort paths alphabetically
  treeNodes.sort((a, b) => a.label.localeCompare(b.label))

  return treeNodes
}

/**
 * Find a tree node by ID
 */
export function findTreeNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    if (node.children) {
      const found = findTreeNode(node.children, id)
      if (found) {
        return found
      }
    }
  }
  return null
}

/**
 * Get all member nodes from tree
 */
export function getAllMembers(nodes: TreeNode[]): DbusMemberInfo[] {
  const members: DbusMemberInfo[] = []

  function traverse(node: TreeNode) {
    if (node.type === 'member' && node.member) {
      members.push(node.member)
    }
    if (node.children) {
      node.children.forEach(traverse)
    }
  }

  nodes.forEach(traverse)
  return members
}
