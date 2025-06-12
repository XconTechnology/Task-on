"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import BoardView from "./board-view"
import ListView from "./list-view"
import TableView from "./table-view"
import TimelineView from "./timeline-view"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutGrid, List, Table, Calendar, Star } from "lucide-react"
import CreateTaskModal from "./modals/create-task-modal"
import SearchFilterBar from "./search-filter-bar"

type ProjectLayoutProps = {
  projectId: string
}

export default function ProjectLayout({ projectId }: ProjectLayoutProps) {
  const { activeView, setActiveView, currentProject } = useAppStore()
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false)

  const viewOptions = [
    { id: "board" as const, label: "Board", icon: LayoutGrid },
    { id: "list" as const, label: "List", icon: List },
    { id: "table" as const, label: "Table", icon: Table },
    { id: "timeline" as const, label: "Timeline", icon: Calendar },
  ]

  const renderView = () => {
    const props = { projectId, setIsModalNewTaskOpen }

    switch (activeView) {
      case "board":
        return <BoardView {...props} />
      case "list":
        return <ListView {...props} />
      case "table":
        return <TableView {...props} />
      case "timeline":
        return <TimelineView {...props} />
      default:
        return <BoardView {...props} />
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 ">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Project Header */}
          <div className="bg-white border-b border-gray-200">
            {/* Breadcrumb */}
            <div className="px-6 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <a href="#" className="text-link">
                  projects
                </a>
                <span className="text-muted">/</span>
                <span className="text-medium font-medium">Project 1</span>
              </div>
            </div>

            {/* Main Header */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="header-medium">{currentProject?.name || "E-commerce Platform"}</h1>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Star size={16} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* View Tabs and Search/Filter Bar */}
              <div className="flex w-full items-center mt-4 justify-between">
                {/* View Tabs */}
                <div className="flex items-center space-x-6">
                  {viewOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.id}
                        onClick={() => setActiveView(option.id)}
                        className={`flex items-center space-x-2 px-1 py-2 border-b-2 transition-colors ${
                          activeView === option.id
                            ? "text-gray-900 border-gray-900"
                            : "text-gray-500 border-transparent hover:text-gray-700"
                        }`}
                      >
                        <Icon size={16} />
                        <span className={`text-medium ${activeView === option.id ? "font-medium" : ""}`}>
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Search and Filter Bar */}
                <div className="max-w-2xl ml-8">
                  <SearchFilterBar />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto custom-scrollbar">{renderView()}</div>
        </div>
      </div>

      <CreateTaskModal isOpen={isModalNewTaskOpen} onClose={() => setIsModalNewTaskOpen(false)} projectId={projectId} />
    </div>
  )
}
