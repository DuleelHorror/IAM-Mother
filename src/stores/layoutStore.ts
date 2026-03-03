import { create } from 'zustand'
import { Model, IJsonModel, Actions, DockLocation } from 'flexlayout-react'

const defaultLayout: IJsonModel = {
  global: {
    tabEnableClose: true,
    tabEnableRename: true,
    tabSetEnableMaximize: true,
    tabSetEnableDrop: true,
    tabSetMinWidth: 60,
    tabSetMinHeight: 50,
    borderBarSize: 0,
    splitterSize: 3,
    tabSetHeaderHeight: 26,
    tabSetTabStripHeight: 26,
    enableRenderOnDemand: false
  },
  borders: [],
  layout: {
    type: 'row',
    weight: 100,
    children: [
      {
        type: 'tabset',
        weight: 50,
        children: [
          {
            type: 'tab',
            name: 'Welcome',
            component: 'welcome'
          }
        ]
      }
    ]
  }
}

export interface Workspace {
  id: string
  name: string
  modelJson: IJsonModel
}

export interface Preset {
  id: string
  name: string
  createdAt: number
  workspaces: Workspace[]
  activeId: string
}

interface LayoutState {
  workspaces: Workspace[]
  activeWorkspaceId: string
  model: Model
  sidebarOpen: boolean

  setModel: (model: Model) => void
  resetModel: () => void
  addPanel: (name: string, component: string, config?: any) => void
  toggleSidebar: () => void
  getModelJson: () => IJsonModel
  loadModelJson: (json: IJsonModel) => void

  // Workspace actions
  addWorkspace: (name?: string) => void
  removeWorkspace: (id: string) => void
  switchWorkspace: (id: string) => void
  renameWorkspace: (id: string, name: string) => void
  getAllWorkspacesJson: () => { workspaces: Workspace[]; activeId: string }
  loadAllWorkspacesJson: (data: { workspaces: Workspace[]; activeId: string }) => void
  saveCurrentToWorkspace: () => void

  // Preset actions
  presets: Preset[]
  loadPresets: () => Promise<void>
  saveAsPreset: (name: string) => Promise<void>
  loadPreset: (id: string) => void
  deletePreset: (id: string) => Promise<void>
}

let nextWsId = 1

/** Ensure critical global settings are always present in a layout JSON */
function patchGlobals(json: IJsonModel): IJsonModel {
  return {
    ...json,
    global: {
      ...json.global,
      enableRenderOnDemand: false
    }
  }
}

export const useLayoutStore = create<LayoutState>((set, get) => {
  const initialWs: Workspace = {
    id: 'ws-0',
    name: 'PRINCIPAL',
    modelJson: defaultLayout
  }

  return {
    workspaces: [initialWs],
    activeWorkspaceId: 'ws-0',
    model: Model.fromJson(patchGlobals(defaultLayout)),
    sidebarOpen: true,

    setModel: (model) => set({ model }),

    resetModel: () => set({ model: Model.fromJson(patchGlobals(defaultLayout)) }),

    addPanel: (name, component, config) => {
      const model = get().model
      model.doAction(
        Actions.addNode(
          {
            type: 'tab',
            name,
            component,
            config: config || {}
          },
          model.getRoot().getId(),
          DockLocation.RIGHT,
          -1
        )
      )
      set({ model })
    },

    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

    getModelJson: () => get().model.toJson() as IJsonModel,

    loadModelJson: (json) => {
      try {
        set({ model: Model.fromJson(patchGlobals(json)) })
      } catch {
        set({ model: Model.fromJson(patchGlobals(defaultLayout)) })
      }
    },

    // === Workspaces ===

    saveCurrentToWorkspace: () => {
      const { workspaces, activeWorkspaceId, model } = get()
      const json = model.toJson() as IJsonModel
      set({
        workspaces: workspaces.map(ws =>
          ws.id === activeWorkspaceId ? { ...ws, modelJson: json } : ws
        )
      })
    },

    addWorkspace: (name?: string) => {
      // Ocultar web views antes de cambiar
      try { window.api.webview.hideAll() } catch {}

      const { workspaces, model, activeWorkspaceId } = get()
      // Guardar el workspace actual antes de cambiar
      const currentJson = model.toJson() as IJsonModel
      const updatedWorkspaces = workspaces.map(ws =>
        ws.id === activeWorkspaceId ? { ...ws, modelJson: currentJson } : ws
      )

      const id = `ws-${++nextWsId}`
      const wsName = name || `PANTALLA ${updatedWorkspaces.length + 1}`
      const newWs: Workspace = {
        id,
        name: wsName,
        modelJson: defaultLayout
      }
      set({
        workspaces: [...updatedWorkspaces, newWs],
        activeWorkspaceId: id,
        model: Model.fromJson(patchGlobals(defaultLayout))
      })
    },

    removeWorkspace: (id) => {
      const { workspaces, activeWorkspaceId } = get()
      if (workspaces.length <= 1) return // no borrar la última

      // Ocultar web views si el workspace activo cambia
      if (activeWorkspaceId === id) {
        try { window.api.webview.hideAll() } catch {}
      }

      const filtered = workspaces.filter(ws => ws.id !== id)
      if (activeWorkspaceId === id) {
        // Cambiar al primer workspace disponible
        const newActive = filtered[0]
        set({
          workspaces: filtered,
          activeWorkspaceId: newActive.id,
          model: Model.fromJson(patchGlobals(newActive.modelJson))
        })
      } else {
        set({ workspaces: filtered })
      }
    },

    switchWorkspace: (id) => {
      const { workspaces, activeWorkspaceId, model } = get()
      if (id === activeWorkspaceId) return

      // Ocultar todas las web views nativas antes de cambiar
      try { window.api.webview.hideAll() } catch {}

      // Guardar el workspace actual
      const currentJson = model.toJson() as IJsonModel
      const updatedWorkspaces = workspaces.map(ws =>
        ws.id === activeWorkspaceId ? { ...ws, modelJson: currentJson } : ws
      )

      // Cargar el nuevo
      const target = updatedWorkspaces.find(ws => ws.id === id)
      if (!target) return

      set({
        workspaces: updatedWorkspaces,
        activeWorkspaceId: id,
        model: Model.fromJson(patchGlobals(target.modelJson))
      })
    },

    renameWorkspace: (id, name) => {
      set({
        workspaces: get().workspaces.map(ws =>
          ws.id === id ? { ...ws, name } : ws
        )
      })
    },

    getAllWorkspacesJson: () => {
      const { workspaces, activeWorkspaceId, model } = get()
      // Incluir el estado actual del workspace activo
      const currentJson = model.toJson() as IJsonModel
      const updated = workspaces.map(ws =>
        ws.id === activeWorkspaceId ? { ...ws, modelJson: currentJson } : ws
      )
      return { workspaces: updated, activeId: activeWorkspaceId }
    },

    loadAllWorkspacesJson: (data) => {
      try {
        if (!data.workspaces || data.workspaces.length === 0) return

        // Actualizar nextWsId para evitar colisiones
        for (const ws of data.workspaces) {
          const num = parseInt(ws.id.replace('ws-', ''))
          if (!isNaN(num) && num >= nextWsId) nextWsId = num + 1
        }

        const active = data.workspaces.find(ws => ws.id === data.activeId) || data.workspaces[0]
        set({
          workspaces: data.workspaces,
          activeWorkspaceId: active.id,
          model: Model.fromJson(patchGlobals(active.modelJson))
        })
      } catch {
        // Ignorar, usar defaults
      }
    },

    // === Presets ===

    presets: [],

    loadPresets: async () => {
      try {
        const presets = await window.api.persistence.getPresets()
        set({ presets: presets || [] })
      } catch {
        // Ignorar
      }
    },

    saveAsPreset: async (name: string) => {
      const { workspaces, activeWorkspaceId, model } = get()
      // Capturar estado actual del workspace activo
      const currentJson = model.toJson() as IJsonModel
      const snapshotWorkspaces = workspaces.map(ws =>
        ws.id === activeWorkspaceId ? { ...ws, modelJson: currentJson } : ws
      )

      const preset: Preset = {
        id: `preset-${Date.now()}`,
        name,
        createdAt: Date.now(),
        workspaces: snapshotWorkspaces,
        activeId: activeWorkspaceId
      }

      try {
        await window.api.persistence.savePreset(preset)
        set({ presets: [...get().presets, preset] })
      } catch {
        // Ignorar
      }
    },

    loadPreset: (id: string) => {
      const preset = get().presets.find(p => p.id === id)
      if (!preset) return

      try { window.api.webview.hideAll() } catch {}

      // Restaurar workspaces del preset
      get().loadAllWorkspacesJson({
        workspaces: preset.workspaces,
        activeId: preset.activeId
      })
    },

    deletePreset: async (id: string) => {
      try {
        await window.api.persistence.deletePreset(id)
        set({ presets: get().presets.filter(p => p.id !== id) })
      } catch {
        // Ignorar
      }
    }
  }
})
