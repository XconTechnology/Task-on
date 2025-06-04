
import {  useDrop } from "react-dnd"
import { type Task, Status } from "@/lib/types"
import {  Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { statusConfig } from "@/lib/constants"
import TaskCard from "./TaskCard"

type TaskColumnProps = {
  status: Status
  tasks: Task[]
  moveTask: (taskId: string, toStatus: Status) => void
  setIsModalNewTaskOpen: (isOpen: boolean) => void
  onTaskClick: (task: Task) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
}

const  TaskColumn =({
  status,
  tasks,
  moveTask,
  setIsModalNewTaskOpen,
  onTaskClick,
  onEditTask,
  onDeleteTask,
}: TaskColumnProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "task",
    drop: (item: { id: string }) => moveTask(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))

  const columnTasks = tasks.filter((task) => task.status === status)
  const config = statusConfig[status]
  return (
    <div
      ref={drop}
      className={`rounded-lg transition-all duration-200 ${
        isOver ? `${config.bgColor} ${config.borderColor} border-2 border-dashed` : "border-2 border-transparent"
      }`}
    >
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-1 h-12 rounded-l-lg" style={{ backgroundColor: config.color }} />
          <div className="flex-1 flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <h3 className="header-extra-small">{config.label}</h3>
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
          />
        ))}

        {columnTasks.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted">No tasks</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskColumn