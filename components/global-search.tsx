"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, User, Folder, Clock, Star, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { searchApi } from "@/lib/api"
import type { SearchResults, Task } from "@/lib/types"

interface GlobalSearchProps {
  onTaskClick?: (task: Task) => void
}

export default function GlobalSearch({ onTaskClick }: GlobalSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuggestions, setIsSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Search with debounce - only search after user stops typing for 500ms
  useEffect(() => {
    if (!query.trim()) {
      return
    }

    // Only search if query is at least 2 characters
    if (query.trim().length < 2) {
      setResults(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setIsSuggestions(false)
      try {
        const response = await searchApi.search(query)
        if (response.success && response.data) {
          setResults(response.data)
          setIsOpen(true)
        }
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setIsLoading(false)
      }
    }, 500) // Increased debounce to 500ms for better performance

    return () => clearTimeout(timeoutId)
  }, [query])

  // Load suggestions when input is focused
  const handleFocus = async () => {
    if (!query.trim()) {
      setIsLoading(true)
      setIsSuggestions(true)
      try {
        const response = await searchApi.getSuggestions()
        if (response.success && response.data) {
          setResults(response.data)
          setIsOpen(true)
        }
      } catch (error) {
        console.error("Failed to load suggestions:", error)
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsOpen(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleTaskClick = (task: Task) => {
    setIsOpen(false)
    setQuery("")
    if (onTaskClick) {
      onTaskClick(task)
    }
  }

  const handleProjectClick = (projectId: string) => {
    setIsOpen(false)
    setQuery("")
    router.push(`/projects/${projectId}`)
  }

  const handleUserClick = () => {
    setIsOpen(false)
    setQuery("")
    router.push("/teams")
  }

  const hasResults =
    results &&
    ((results.tasks && results.tasks.length > 0) ||
      (results.projects && results.projects.length > 0) ||
      (results.users && results.users.length > 0))

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300" size={16} />
        <Input
          ref={inputRef}
          placeholder="Search tasks, projects, people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="w-full bg-gray-100 border border-gray-200 rounded-lg py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden shadow-xl border border-gray-200 bg-white">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-small">{isSuggestions ? "Loading suggestions..." : "Searching..."}</p>
              </div>
            ) : hasResults ? (
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-medium font-semibold text-gray-900">
                      {isSuggestions ? "Recent & Popular" : `Search Results`}
                    </h3>
                    {!isSuggestions && query && (
                      <Badge variant="outline" className="text-small">
                        &quot;{query}&quot;
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Tasks */}
                {results?.tasks && results.tasks.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center space-x-2 px-3 py-2 text-label-small text-gray-500 uppercase tracking-wide">
                      <FileText size={14} />
                      <span>Tasks</span>
                      {isSuggestions && <Clock size={12} className="text-gray-400" />}
                    </div>
                    {results.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="flex items-center space-x-3 px-3 py-3 hover:bg-blue-50 cursor-pointer rounded-lg transition-colors group"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <FileText className="text-blue-600" size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-medium font-medium text-gray-900 truncate">{task.title}</p>
                          <p className="text-small text-gray-500 truncate">{task.description || "No description"}</p>
                          {task.assignee && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={task.assignee.profilePictureUrl || "/placeholder.svg"} />
                                <AvatarFallback className="text-extra-small bg-gray-100">
                                  {task.assignee.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-extra-small text-gray-400">{task.assignee.username}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge
                            variant="outline"
                            className={`text-small ${
                              task.status === "Completed"
                                ? "border-green-200 text-green-700 bg-green-50"
                                : task.status === "In Progress"
                                  ? "border-blue-200 text-blue-700 bg-blue-50"
                                  : task.status === "Under Review"
                                    ? "border-orange-200 text-orange-700 bg-orange-50"
                                    : "border-gray-200 text-gray-700 bg-gray-50"
                            }`}
                          >
                            {task.status}
                          </Badge>
                          {task.priority && (
                            <Badge
                              variant="outline"
                              className={`text-extra-small ${
                                task.priority === "Urgent"
                                  ? "border-red-200 text-red-700 bg-red-50"
                                  : task.priority === "High"
                                    ? "border-orange-200 text-orange-700 bg-orange-50"
                                    : task.priority === "Medium"
                                      ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                                      : "border-green-200 text-green-700 bg-green-50"
                              }`}
                            >
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {results?.projects && results.projects.length > 0 && (
                  <div className="p-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2 px-3 py-2 text-label-small text-gray-500 uppercase tracking-wide">
                      <Folder size={14} />
                      <span>Projects</span>
                      {isSuggestions && <TrendingUp size={12} className="text-gray-400" />}
                    </div>
                    {results.projects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        className="flex items-center space-x-3 px-3 py-3 hover:bg-green-50 cursor-pointer rounded-lg transition-colors group"
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <Folder className="text-green-600" size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-medium font-medium text-gray-900 truncate">{project.name}</p>
                          <p className="text-small text-gray-500 truncate">{project.description || "No description"}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-small ${
                            project.status === "active"
                              ? "border-green-200 text-green-700 bg-green-50"
                              : project.status === "completed"
                                ? "border-blue-200 text-blue-700 bg-blue-50"
                                : "border-gray-200 text-gray-700 bg-gray-50"
                          }`}
                        >
                          {project.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Users */}
                {results?.users && results.users.length > 0 && (
                  <div className="p-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2 px-3 py-2 text-label-small text-gray-500 uppercase tracking-wide">
                      <User size={14} />
                      <span>People</span>
                      {isSuggestions && <Star size={12} className="text-gray-400" />}
                    </div>
                    {results.users.map((user) => (
                      <div
                        key={user.id}
                        onClick={handleUserClick}
                        className="flex items-center space-x-3 px-3 py-3 hover:bg-purple-50 cursor-pointer rounded-lg transition-colors group"
                      >
                        <Avatar className="h-8 w-8 border-2 border-purple-100 group-hover:border-purple-200 transition-colors">
                          <AvatarImage src={user.profilePictureUrl || "/placeholder.svg"} />
                          <AvatarFallback className="text-small bg-purple-100 text-purple-700">
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-medium font-medium text-gray-900 truncate">{user.username}</p>
                          <p className="text-small text-gray-500 truncate">{user.email}</p>
                        </div>
                        {user.role && (
                          <Badge
                            variant="outline"
                            className={`text-extra-small ${
                              user.role === "Owner"
                                ? "border-purple-200 text-purple-700 bg-purple-50"
                                : user.role === "Admin"
                                  ? "border-blue-200 text-blue-700 bg-blue-50"
                                  : "border-gray-200 text-gray-700 bg-gray-50"
                            }`}
                          >
                            {user.role}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : query.trim() && query.trim().length >= 2 ? (
              <div className="p-6 text-center text-gray-500">
                <Search size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-medium font-medium mb-1">No results found</p>
                <p className="text-small text-gray-400">Try searching with different keywords or check your spelling</p>
              </div>
            ) : query.trim() && query.trim().length < 2 ? (
              <div className="p-6 text-center text-gray-500">
                <Search size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-medium font-medium mb-1">Keep typing...</p>
                <p className="text-small text-gray-400">Enter at least 2 characters to search</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
