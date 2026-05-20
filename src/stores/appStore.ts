/**
 * Application State Store
 * Manages global application state using Zustand
 */

import { create } from 'zustand'
import type { DbusMemberInfo } from '../types/electron-api'

export type BusType = 'session' | 'system'
export type ActiveMode = 'browse' | 'workbench' | 'signal'

export interface TreeNode {
  id: string
  label: string
  type: 'service' | 'path' | 'interface' | 'category' | 'member'
  children?: TreeNode[]
  member?: DbusMemberInfo
}

interface AppStore {
  // Bus type
  activeBus: BusType
  setActiveBus: (bus: BusType) => void

  // Active mode
  activeMode: ActiveMode
  setActiveMode: (mode: ActiveMode) => void

  // Selected service
  selectedServiceId: string | null
  selectedServiceName: string | null
  setSelectedService: (id: string, name: string) => void
  clearSelectedService: () => void

  // Selected member
  selectedMemberId: string | null
  selectedNode: TreeNode | null
  setSelectedMember: (id: string, node: TreeNode) => void
  clearSelectedMember: () => void

}

export const useAppStore = create<AppStore>((set) => ({
  // Bus type
  activeBus: 'session',
  setActiveBus: (bus) => set({ activeBus: bus }),

  // Active mode
  activeMode: 'browse',
  setActiveMode: (mode) => set({ activeMode: mode }),

  // Selected service
  selectedServiceId: null,
  selectedServiceName: null,
  setSelectedService: (id, name) =>
    set({
      selectedServiceId: id,
      selectedServiceName: name,
      selectedMemberId: null,
      selectedNode: null,
    }),
  clearSelectedService: () =>
    set({
      selectedServiceId: null,
      selectedServiceName: null,
      selectedMemberId: null,
      selectedNode: null,
    }),

  // Selected member
  selectedMemberId: null,
  selectedNode: null,
  setSelectedMember: (id, node) =>
    set({
      selectedMemberId: id,
      selectedNode: node,
    }),
  clearSelectedMember: () =>
    set({
      selectedMemberId: null,
      selectedNode: null,
    }),
}))
