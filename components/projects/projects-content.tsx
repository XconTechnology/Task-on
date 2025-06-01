"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/lib/user-context"
import { Plus, Search, Filter, Grid, List, Calendar, Users, Target, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import CreateProjectModal from "@/components/modals/create-project-modal"
import EditProjectModal from "@/components/modals/edit-project-modal"
import type { Project } from "@/lib/types"

export default function ProjectsContent() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()

      if (data.success) {
        setProjects(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev])
  }

  const handleEditProject = (project: any) => {
    setEditingProject(project)
    setIsEditModalOpen(true)
  }

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects((prev) => prev.map((project) => (project.id === updatedProject.id ? updatedProject : project)))
  }

  const handleProjectDeleted = (projectId: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId))
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="header-large">Projects</h1>
            <p className="text-description mt-1">Manage and organize all your projects in one place.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            <span className="text-medium">New Project</span>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter size={16} className="mr-2" />
              <span className="text-medium">Filter</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid size={16} />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List size={16} />
            </Button>
          </div>
        </div>

        {/* Projects Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onEdit={handleEditProject} />
            ))}
            {filteredProjects.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Target size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="header-small mb-2">No projects found</h3>
                <p className="text-description mb-4">Create your first project to get started.</p>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  <span className="text-medium text-white">Create Project</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <ProjectListItem key={project.id} project={project} onEdit={handleEditProject} />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={editingProject}
        onSuccess={handleProjectUpdated}
        onDelete={handleProjectDeleted}
      />
    </>
  )
}

function ProjectCard({ project, onEdit }: { project: Project; onEdit: (project: Project) => void }) {
  const [stats, setStats] = useState({ progress: 0, teamMembers: 0 })

  useEffect(() => {
    fetchProjectStats()
  }, [project.id])

  const fetchProjectStats = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/stats`)
      const data = await response.json()
      if (data.success) {
        setStats({
          progress: data.data.progress,
          teamMembers: data.data.teamMembers,
        })
      }
    } catch (error) {
      console.error("Failed to fetch project stats:", error)
    }
  }

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {project.name}
            </CardTitle>
            <p className="text-description mt-1 line-clamp-2">{project.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEdit(project)}
          >
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-small text-gray-600">Progress</span>
              <span className="text-small font-medium text-gray-900">{stats.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>

          {/* Team and Dates */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users size={14} className="text-gray-400" />
              <span className="text-small text-gray-600">{stats.teamMembers} members</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-small text-gray-600">
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : "No deadline"}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {project.status === "active" ? "Active" : project.status === "completed" ? "Completed" : "Archived"}
            </Badge>
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(stats.teamMembers, 4) }).map((_, i) => (
                <Avatar key={i} className="h-6 w-6 border-2 border-white">
                  <AvatarImage src={`/placeholder.svg?height=24&width=24&text=${i + 1}`} />
                  <AvatarFallback className="text-extra-small">U{i + 1}</AvatarFallback>
                </Avatar>
              ))}
              {stats.teamMembers > 4 && (
                <div className="h-6 w-6 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center">
                  <span className="text-extra-small text-gray-600">+{stats.teamMembers - 4}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectListItem({ project, onEdit }: { project: Project; onEdit: (project: Project) => void }) {
  const [stats, setStats] = useState({ progress: 0, teamMembers: 0 })

  useEffect(() => {
    fetchProjectStats()
  }, [project.id])

  const fetchProjectStats = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/stats`)
      const data = await response.json()
      if (data.success) {
        setStats({
          progress: data.data.progress,
          teamMembers: data.data.teamMembers,
        })
      }
    } catch (error) {
      console.error("Failed to fetch project stats:", error)
    }
  }

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-description mt-1">{project.description}</p>
              </div>
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <p className="text-small text-gray-600">Progress</p>
                  <p className="text-medium font-semibold text-gray-900">{stats.progress}%</p>
                </div>
                <div className="text-center">
                  <p className="text-small text-gray-600">Team</p>
                  <p className="text-medium font-semibold text-gray-900">{stats.teamMembers} members</p>
                </div>
                <div className="text-center">
                  <p className="text-small text-gray-600">Due Date</p>
                  <p className="text-medium font-semibold text-gray-900">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : "No deadline"}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {project.status === "active" ? "Active" : project.status === "completed" ? "Completed" : "Archived"}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(project)}>
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
