'use client'
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { projectApi } from "@/lib/api"
import type { Project, ProjectStats } from "@/lib/types"
import { Plus } from "lucide-react"

const RecentProjectsSection = ({ onCreateProject }: { onCreateProject: () => void }) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectStats, setProjectStats] = useState<{ [key: string]: ProjectStats }>({})
  const [isLoading, setIsLoading] = useState(true)

  // Fetch real projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectApi.getProjects()

        if (response.success && response.data) {
          // Get only the 3 most recent projects
          const recentProjects = response.data.slice(0, 3)
          setProjects(recentProjects)

          // Fetch stats for each project
          const statsPromises = recentProjects.map((project) => projectApi.getProjectStats(project.id))

          const statsResults = await Promise.all(statsPromises)

          // Create a map of project ID to stats
          const statsMap: { [key: string]: ProjectStats } = {}
          statsResults.forEach((result, index) => {
            if (result.success && result.data && recentProjects[index]) {
              statsMap[recentProjects[index].id] = result.data
            }
          })

          setProjectStats(statsMap)
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <div className="p-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-label">Recent Projects</h3>
        <Button variant="ghost" size="sm" className="p-1 h-6 w-6" onClick={onCreateProject}>
          <Plus size={12} />
        </Button>
      </div>
      <div className="space-y-2">
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-3/4" />
              </div>
              <Skeleton className="h-5 w-8 rounded" />
            </div>
          ))
        ) : projects.length > 0 ? (
          projects.map((project: Project) => {
            const stats = projectStats[project.id] || { progress: 0, totalTasks: 0 }
            return (
              <Link
                href={`/projects/${project.id}`}
                key={project.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0 bg-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-medium truncate">{project.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${stats.progress || 0}%` }} />
                    </div>
                    <span className="text-muted-small">{stats.progress || 0}%</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-small">
                  {stats.totalTasks || 0}
                </Badge>
              </Link>
            )
          })
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-small">No projects yet</p>
            <Button variant="ghost" size="sm" onClick={onCreateProject} className="mt-2">
              <Plus size={12} className="mr-1" />
              <span className="text-small">Create first project</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
export default RecentProjectsSection
