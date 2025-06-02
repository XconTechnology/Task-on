"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, FileText, User, Folder } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { searchApi } from "@/lib/api"
import type { SearchResults } from "@/lib/types"

export default function GlobalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      setIsOpen(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
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
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      inputRef.current?.blur()
    }
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
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          className="pl-10 h-8 bg-purple-500/20 border-purple-400/30 text-white placeholder:text-purple-200 focus:bg-white focus:text-gray-900 focus:placeholder:text-gray-500 transition-all"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden shadow-lg border border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-small">Searching...</p>
              </div>
            ) : hasResults ? (
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {/* Tasks */}
                {results?.tasks && results.tasks.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center space-x-2 px-3 py-2 text-label-small text-gray-500 uppercase tracking-wide">
                      <FileText size={14} />
                      <span>Tasks</span>
                    </div>
                    {results.tasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-medium font-medium text-gray-900 truncate">{task.title}</p>
                          <p className="text-small text-gray-500 truncate">{task.description}</p>
                        </div>
                        <Badge variant="outline" className="text-small">
                          {task.status}
                        </Badge>
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
                    </div>
                    {results.projects.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Folder className="text-blue-600" size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-medium font-medium text-gray-900 truncate">{project.name}</p>
                          <p className="text-small text-gray-500 truncate">{project.description}</p>
                        </div>
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
                    </div>
                    {results.users.slice(0, 3).map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profilePictureUrl || "/placeholder.svg"} />
                          <AvatarFallback className="text-small">
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-medium font-medium text-gray-900 truncate">{user.username}</p>
                          <p className="text-small text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : query.trim() ? (
              <div className="p-4 text-center text-gray-500">
                <Search size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-small">No results found for "{query}"</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
