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
      <div className="bg-gray-50 p-2 rounded-lg">
              {/* Column Header */}
      <div className="mb-1">
        <div className="flex items-center  rounded-lg ">
          <div className="w-1 h-5 rounded-lg" style={{ backgroundColor: config.color }} />
          <div className="flex-1 flex items-center justify-between px-2 py-1">
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
                className="p-1 h-8 w-8 text-gray-600"
                onClick={() => setIsModalNewTaskOpen(true)}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3  custom-scrollbar overflow-y-auto">
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
      </div>
          {/* Add New Task Button */}
        <div
          className="mt-3 py-2 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
          onClick={() => setIsModalNewTaskOpen(true)}
        >
          <div className="flex items-center justify-center space-x-2 text-gray-500 group-hover:text-gray-700">
            <Plus size={14} className="text-gray-400 group-hover:text-gray-600" />
            <span className="text-xs font-medium">Add new</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskColumn
