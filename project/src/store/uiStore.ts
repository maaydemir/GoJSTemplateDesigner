import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type InspectorTab = 'properties' | 'bindings' | 'help'

interface UIState {
  isPaletteCollapsed: boolean
  isInspectorCollapsed: boolean
  inspectorTab: InspectorTab
  togglePalette: () => void
  toggleInspector: () => void
  setInspectorTab: (tab: InspectorTab) => void
}

type PersistedUIState = Pick<UIState, 'isPaletteCollapsed' | 'isInspectorCollapsed' | 'inspectorTab'>

export const useUIStore = create(
  persist<UIState, [], [], PersistedUIState>(
    (set): UIState => ({
      isPaletteCollapsed: false,
      isInspectorCollapsed: false,
      inspectorTab: 'properties',
      togglePalette: () =>
        set(state => ({
          isPaletteCollapsed: !state.isPaletteCollapsed
        })),
      toggleInspector: () =>
        set(state => ({
          isInspectorCollapsed: !state.isInspectorCollapsed
        })),
      setInspectorTab: tab => set({ inspectorTab: tab })
    }),
    {
      name: 'designer-ui-preferences',
      partialize: state => ({
        isPaletteCollapsed: state.isPaletteCollapsed,
        isInspectorCollapsed: state.isInspectorCollapsed,
        inspectorTab: state.inspectorTab
      })
    }
  )
)
