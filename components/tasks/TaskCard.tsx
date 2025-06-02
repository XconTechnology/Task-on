import {  useDrag } from "react-dnd"
import { type Task } from "@/lib/types"
import {  MessageSquareMore } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import TaskActionsDropdown from "./task-actions-dropdown"

type TaskCardProps = {
  task: Task
  onTaskClick: (task: Task) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
}

const TaskCard =({ task, onTaskClick, onEditTask, onDeleteTask }: TaskCardProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "task",
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  const numberOfComments = task.comments?.length || 0

  const priorityConfig = {
    Urgent: "bg-red-100 text-red-700 border-red-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Low: "bg-green-100 text-green-700 border-green-200",
    Backlog: "bg-gray-100 text-gray-700 border-gray-200",
  }

  return (
    <Card
      ref={drag}
      onClick={() => onTaskClick(task)}
      className={`task-card transition-all duration-200 hover:shadow-lg bg-white border border-gray-200 ${
        isDragging ? "dragging opacity-50 rotate-1 scale-105 shadow-xl" : "opacity-100"
      }`}
    >
      <CardContent className="p-0">
        <div className="p-4 pt-4">
          {/* Priority and Tags */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {task.priority && (
                <Badge variant="outline" className={`text-small ${priorityConfig[task.priority]}`}>
                  {task.priority}
                </Badge>
              )}
            
            </div>
            <TaskActionsDropdown task={task} onEdit={onEditTask} onDelete={onDeleteTask} size="sm" />
          </div>

          {/* Task Title */}
          <h4 className="text-medium font-semibold mb-2 line-clamp-2">{task.title}</h4>

          {/* Task Description */}
          {task.description && <p className="text-description mb-3 line-clamp-2">{task.description}</p>}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              {/* Assignee and Author */}
              <div className="flex -space-x-1">
                {task.assignee && (
                  <Avatar className="h-6 w-6 border-2 border-white">
                    <AvatarImage src={task.assignee.profilePictureUrl || "/placeholder.svg"} />
                    <AvatarFallback className="text-small bg-blue-100 text-blue-700">
                      {task.assignee.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {task.author && task.author.id !== task.assignee?.id && (
                  <Avatar className="h-6 w-6 border-2 border-white">
                    <AvatarImage src={task.author.profilePictureUrl || "/placeholder.svg"} />
                    <AvatarFallback className="text-small bg-gray-100 text-gray-700">
                      {task.author.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 text-gray-500">
              {/* Comments */}
              {numberOfComments > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageSquareMore size={14} />
                  <span className="text-small">{numberOfComments}</span>
                </div>
              )}

            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TaskCard