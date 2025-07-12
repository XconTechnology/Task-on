"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, FileText } from "lucide-react"
import { documentApi, projectApi, taskApi } from "@/lib/api"
import { DocumentCard } from "@/components/documents/document-card"
import { DocumentSkeletonGrid } from "@/components/documents/document-skeleton"
import { CreateDocumentDialog } from "@/components/documents/create-document-dialog"
import { EditDocumentDialog } from "@/components/documents/edit-document-dialog"
import type { Document, Project, Task } from "@/lib/types"

export default function DocumentsPage() {
  const [allDocuments, setAllDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters - these are now client-side only
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [selectedTask, setSelectedTask] = useState<string>("all")
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)

  // Client-side filtering - no more API calls for search
  const filteredDocuments = useMemo(() => {
    let filtered = allDocuments

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.fileName.toLowerCase().includes(query) ||
          doc.project?.name.toLowerCase().includes(query) ||
          doc.task?.title.toLowerCase().includes(query),
      )
    }

    // Project filter
    if (selectedProject !== "all") {
      filtered = filtered.filter((doc) => doc.projectId === selectedProject)
    }

    // Task filter
    if (selectedTask !== "all") {
      filtered = filtered.filter((doc) => doc.taskId === selectedTask)
    }

    return filtered
  }, [allDocuments, searchQuery, selectedProject, selectedTask])

  // Load initial data
  useEffect(() => {
    loadProjects()
    loadTasks()
    loadDocuments(1, true)
  }, [])

  // Load tasks when project changes
  useEffect(() => {
    if (selectedProject !== "all") {
      loadTasksForProject(selectedProject)
      setSelectedTask("all") // Reset task selection
    } else {
      loadTasks()
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const response = await projectApi.getProjects()
      if (response.success && response.data) {
        setProjects(response.data)
      }
    } catch (error) {
      console.error("Failed to load projects:", error)
    }
  }

  const loadTasks = async () => {
    try {
      const response = await taskApi.getALLTasks()
      if (response.success && response.data) {
        setTasks(response.data)
      }
    } catch (error) {
      console.error("Failed to load tasks:", error)
    }
  }

  const loadTasksForProject = async (projectId: string) => {
    try {
      const response = await taskApi.getTasks(projectId)
      if (response.success && response.data) {
        setTasks(response.data)
      }
    } catch (error) {
      console.error("Failed to load project tasks:", error)
    }
  }

  const loadDocuments = async (pageNum: number, reset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      // Load all documents without filters - filtering happens client-side
      const response = await documentApi.getDocuments(pageNum, 10)

      if (response.success && response.data) {
        const newDocuments = response.data.documents

        if (reset || pageNum === 1) {
          setAllDocuments(newDocuments)
        } else {
          setAllDocuments((prev) => [...prev, ...newDocuments])
        }

        setHasMore(response.data.hasMore)
        setTotal(response.data.total)
        setPage(pageNum)
      }
    } catch (error) {
      console.error("Failed to load documents:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      loadDocuments(page + 1)
    }
  }

  const handleCreateSuccess = () => {
    setPage(1)
    setAllDocuments([])
    loadDocuments(1, true)
  }

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document)
    setShowEditDialog(true)
  }

  const handleEditSuccess = () => {
    setPage(1)
    setAllDocuments([])
    loadDocuments(1, true)
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await documentApi.deleteDocument(documentId)
      if (response.success) {
        setAllDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
        setTotal((prev) => prev - 1)
      }
    } catch (error) {
      console.error("Failed to delete document:", error)
    }
  }

  // Group filtered documents by project and task
  const groupedDocuments = filteredDocuments.reduce(
    (groups, doc) => {
      const key = `${doc.projectId || "no-project"}-${doc.taskId || "no-task"}`
      if (!groups[key]) {
        groups[key] = {
          projectId: doc.projectId,
          projectName: doc.project?.name,
          taskId: doc.taskId,
          taskTitle: doc.task?.title,
          documents: [],
        }
      }
      groups[key].documents.push(doc)
      return groups
    },
    {} as Record<string, any>,
  )

  const groupedArray = Object.values(groupedDocuments)

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Documents</h1>
          <p className="text-medium text-gray-600 mt-1">Manage and organize your workspace documents</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          <h1 className="text-medium">Upload Document</h1>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documents, projects, or tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-xs"
            />
          </div>
        </div>

        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-48 text-xs">
            <SelectValue  placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent >
            <SelectItem  value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem className="text-xs" key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTask} onValueChange={setSelectedTask}>
          <SelectTrigger className="w-full sm:w-48 text-xs">
            <SelectValue placeholder="All Tasks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem className="text-xs" value="all">All Tasks</SelectItem>
            {tasks.map((task) => (
              <SelectItem className="text-xs" key={task.id} value={task.id}>
                {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileText className="h-4 w-4" />
          <span>
            {loading
              ? "Loading..."
              : `${filteredDocuments.length} of ${total} document${total !== 1 ? "s" : ""} ${
                  filteredDocuments.length !== total ? "shown" : "found"
                }`}
          </span>
        </div>
      </div>

      {/* Documents */}
      <div className="space-y-6">
        {loading ? (
          <DocumentSkeletonGrid />
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedProject !== "all" || selectedTask !== "all"
                ? "Try adjusting your filters or search terms"
                : "Upload your first document to get started"}
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        ) : (
          <>
            {groupedArray.map((group, index) => (
              <div key={index} className="space-y-4">
                {/* Group Header */}
                <div className="border-b pb-2">
                  <h3 className="font-medium text-large text-gray-900">
                    {group.projectName && group.taskTitle
                      ? `${group.projectName} → ${group.taskTitle}`
                      : group.projectName
                        ? group.projectName
                        : group.taskTitle
                          ? `Task: ${group.taskTitle}`
                          : "Unassigned Documents"}
                  </h3>
                  <p className="text-medium text-gray-500">
                    {group.documents.length} document{group.documents.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.documents.map((document: Document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      onEdit={handleEditDocument}
                      onDelete={handleDeleteDocument}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Load More - only show if there are more documents to load from server */}
            {hasMore && allDocuments.length === filteredDocuments.length && (
              <div className="text-center py-6">
                <Button onClick={loadMore} disabled={loadingMore} variant="outline">
                  {loadingMore ? "Loading..." : "Load More Documents"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <CreateDocumentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      <EditDocumentDialog
        document={editingDocument}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
