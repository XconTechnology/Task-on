"use client"

import { useDrop } from "react-dnd"
import type { Task, Status } from "@/lib/types"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { statusConfig } from "@/lib/constants"
import TaskCard from "./TaskCard"
import { useRef } from "react"

type TaskColumnProps = {
  status: Status
  tasks: Task[]
  moveTask: (taskId: string, toStatus: Status) => void
  setIsModalNewTaskOpen: (isOpen: boolean) => void
  onTaskClick: (task: Task) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  commentCounts?: Record<string, number>
}

const TaskColumn = ({
  status,
  tasks,
  moveTask,
  setIsModalNewTaskOpen,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  commentCounts = {},
}: TaskColumnProps) => {
  const ref = useRef<HTMLDivElement>(null)

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "task",
    drop: (item: { id: string }) => {
      moveTask(item.id, status)
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }))

  drop(ref) // Connect the drop target to the ref

  const columnTasks = tasks.filter((task) => task.status === status)
  const config = statusConfig[status]

  return (
    <div
      ref={ref}
      className={`rounded-lg transition-all duration-300 ease-in-out ${
        isOver && canDrop
          ? `${config.bgColor} ${config.borderColor} border-2 border-dashed scale-[1.02] shadow-lg`
          : isOver
            ? "border-2 border-gray-300 border-dashed"
            : "border-2 border-transparent"
      }`}
    >
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-1 h-12 rounded-l-lg" style={{ backgroundColor: config.color }} />
          <div className="flex-1 flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <h3 className="text-large font-semibold">{config.label}</h3>
              <span className="inline-flex items-center justify-center w-6 h-6 text-small font-medium text-gray-600 bg-gray-100 rounded-full">
                {columnTasks.length}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8 bg-gray-100 hover:bg-gray-200 text-gray-600"
                onClick={() => setIsModalNewTaskOpen(true)}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3 min-h-[400px] custom-scrollbar overflow-y-auto">
        {columnTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onTaskClick={onTaskClick}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            commentCount={commentCounts[task.id]}
          />
        ))}

        {columnTasks.length === 0 && (
          <div
            className={`text-center py-8 transition-all duration-300 ${
              isOver && canDrop ? "text-gray-700" : "text-gray-400"
            }`}
          >
            <div className="text-muted">{isOver && canDrop ? "Drop task here" : "No tasks"}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskColumn
