"use client"

import type React from "react"

import { useState } from "react"
import { Status } from "@/lib/types"
import { Check, Circle, Play, Pause, CheckCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type StatusDropdownProps = {
  currentStatus: Status
  onStatusChange: (status: Status) => void
  children: React.ReactNode
}

const statusOptions = [
  {
    value: Status?.ToDo,
    label: "TO DO",
    icon: Circle,
    color: "text-gray-500",
    bgColor: "hover:bg-gray-50",
    category: "Active",
  },
  {
    value: Status?.WorkInProgress,
    label: "IN PROGRESS",
    icon: Play,
    color: "text-blue-600",
    bgColor: "hover:bg-blue-50",
    category: "Active",
  },
  {
    value: Status?.UnderReview,
    label: "UNDER REVIEW",
    icon: Pause,
    color: "text-orange-500",
    bgColor: "hover:bg-orange-50",
    category: "Active",
  },
  {
    value: Status?.Completed,
    label: "COMPLETE",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "hover:bg-green-50",
    category: "Done",
  },
]

export default function StatusDropdown({ currentStatus, onStatusChange, children }: StatusDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("status")

  const filteredStatuses = statusOptions.filter((status) =>
    status?.label.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activeStatuses = filteredStatuses.filter((status) => status?.category === "Active")
  const doneStatuses = filteredStatuses.filter((status) => status?.category === "Done")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-0 bg-white border border-gray-200 shadow-lg rounded-lg"
        align="start"
        sideOffset={5}
      >
        {/* Tabs Header */}
        <div className="border-b border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0 rounded-none">
              <TabsTrigger
                value="status"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent"
              >
                Status
              </TabsTrigger>
              <TabsTrigger
                value="task-type"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent"
              >
                Task Type
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-medium border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Content */}
        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          {/* Not Started Section */}
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 py-1 mb-1">Not started</div>
            <DropdownMenuItem
              className="flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50"
              onClick={() => onStatusChange(Status.ToDo)}
            >
              <Circle className="text-gray-400" size={16} />
              <span className="text-medium text-gray-700">TO DO</span>
              {currentStatus === Status.ToDo && <Check className="ml-auto text-blue-600" size={16} />}
            </DropdownMenuItem>
          </div>

          {/* Active Section */}
          {activeStatuses.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 py-1 mb-1">Active</div>
              {activeStatuses.map((status) => {
                const Icon = status.icon
                return (
                  <DropdownMenuItem
                    key={status?.value}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer ${status.bgColor}`}
                    onClick={() => onStatusChange(status?.value)}
                  >
                    <Icon className={status?.color} size={16} />
                    <span className="text-medium text-gray-700">{status?.label}</span>
                    {currentStatus === status.value && <Check className="ml-auto text-blue-600" size={16} />}
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}

          {/* Done Section */}
          {doneStatuses.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 py-1 mb-1">Done</div>
              {doneStatuses.map((status) => {
                const Icon = status.icon
                return (
                  <DropdownMenuItem
                    key={status.value}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer ${status.bgColor}`}
                    onClick={() => onStatusChange(status.value)}
                  >
                    <Icon className={status.color} size={16} />
                    <span className="text-medium text-gray-700">{status.label}</span>
                    {currentStatus === status.value && <Check className="ml-auto text-blue-600" size={16} />}
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
