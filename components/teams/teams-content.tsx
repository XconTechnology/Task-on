"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Users, Mail, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent} from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import InviteModal from "@/components/modals/invite-modal"
import CreateTeamModal from "@/components/modals/create-team-modal"
import EditTeamModal from "@/components/modals/edit-team-modal"
import { teamApi } from "@/lib/api/teams"
import Link from "next/link"
import type { Team} from "@/lib/types"

export default function TeamsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false)


  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await teamApi.getTeams()
      if (response.success) {
        setTeams(response.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
    } finally {
      setIsLoadingTeams(false)
    }
  }

  const handleEditTeam = (team: any) => {
    setEditingTeam(team)
    setIsEditTeamModalOpen(true)
  }

  const handleTeamCreated = (newTeam: any) => {
    setTeams((prev) => [newTeam, ...prev])
  }

  const handleTeamUpdated = (updatedTeam: any) => {
    setTeams((prev) => prev.map((team: any) => (team.id === updatedTeam.id ? updatedTeam : team)))
  }

  const handleTeamDeleted = (teamId: string) => {
    setTeams((prev) => prev.filter((team: any) => team.id !== teamId))
  }

  const filteredTeams = teams.filter((team: any) => team.teamName.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="header-large">Teams</h1>
            <p className="text-description mt-1">Manage your teams and collaborate with members.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}>
              <Mail size={16} className="mr-2" />
              <span className="text-medium">Invite Members</span>
            </Button>
            <Button className=" " onClick={() => setIsCreateTeamModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              <span className="text-medium">Create Team</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search teams or members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="teams" className="space-y-6">
          <TabsContent value="teams" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingTeams ? (
                // Skeleton loading for teams
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-48" />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredTeams.length > 0 ? (
                filteredTeams.map((team: any) => (
                  <Card
                    key={team.id}
                    className="bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 bg-gradient-to-r from-green-600 to-emerald-300 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">{team.teamName.charAt(0)}</span>
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                              {team.teamName}
                            </CardTitle>
                            <p className="text-description">{team.description || "No description"}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditTeam(team)}
                        >
                          <Settings size={16} />
                        </Button>
                      </div>
                    </CardHeader>
                    <Link href={`/chat/${team.id}`}>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Users size={14} className="text-gray-400" />
                              <span className="text-small text-gray-600">{team.memberCount || 0} members</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Settings size={14} className="text-gray-400" />
                              <span className="text-small text-gray-600">0 projects</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Active
                          </Badge>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="header-small mb-2">No teams found</h3>
                  <p className="text-description mb-4">Create your first team to get started.</p>
                  <Button className="bg-primary hover:bg-bg_hovered" onClick={() => setIsCreateTeamModalOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    <span className="text-medium text-white">Create Team</span>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onSuccess={handleTeamCreated}
      />
      <EditTeamModal
        isOpen={isEditTeamModalOpen}
        onClose={() => setIsEditTeamModalOpen(false)}
        team={editingTeam}
        onSuccess={handleTeamUpdated}
        onDelete={handleTeamDeleted}
      />
    </>
  )
}
