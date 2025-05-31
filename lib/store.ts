import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Task, Project, User, Team } from "./types"

interface AppState {
  // UI State
  isSidebarCollapsed: boolean
  activeView: "board" | "list" | "table" | "timeline"

  // Data State
  currentProject: Project | null
  tasks: Task[]
  projects: Project[]
  users: User[]
  teams: Team[]

  // Loading States
  isLoading: boolean
  error: string | null

  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveView: (view: "board" | "list" | "table" | "timeline") => void
  setCurrentProject: (project: Project | null) => void
  setTasks: (tasks: Task[]) => void
  setProjects: (projects: Project[]) => void
  setUsers: (users: User[]) => void
  setTeams: (teams: Team[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Task Actions
  updateTaskStatus: (taskId: string, status: string) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      isSidebarCollapsed: false,
      activeView: "board",
      currentProject: null,
      tasks: [],
      projects: [],
      users: [],
      teams: [],
      isLoading: false,
      error: null,

      // UI Actions
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      setActiveView: (view) => set({ activeView: view }),

      // Data Actions
      setCurrentProject: (project) => set({ currentProject: project }),
      setTasks: (tasks) => set({ tasks }),
      setProjects: (projects) => set({ projects }),
      setUsers: (users) => set({ users }),
      setTeams: (teams) => set({ teams }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Task Actions
      updateTaskStatus: (taskId, status) => {
        const tasks = get().tasks.map((task) =>
          task.id === taskId ? { ...task, status: status as any, updatedAt: new Date().toISOString() } : task,
        )
        set({ tasks })
      },

      addTask: (task) => {
        const tasks = [...get().tasks, task]
        set({ tasks })
      },

      updateTask: (taskId, updates) => {
        const tasks = get().tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task,
        )
        set({ tasks })
      },

      deleteTask: (taskId) => {
        const tasks = get().tasks.filter((task) => task.id !== taskId)
        set({ tasks })
      },
    }),
    {
      name: "project-management-store",
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        activeView: state.activeView,
        currentProject: state.currentProject,
      }),
    },
  ),
)
