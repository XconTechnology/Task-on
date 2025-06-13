'use client'
import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Plus } from 'lucide-react'
import { Skeleton } from '../ui/skeleton'
import { Team } from '@/lib/types'
import Link from 'next/link'
import { teamApi } from '@/lib/api/teams'

const TeamsSection = ({ onCreateTeam }: { onCreateTeam: () => void }) => {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch real teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await teamApi.getTeams()
        if (response.success) {
          setTeams(response.data?.slice(0, 3) || []) // Show only first 3
        }
      } catch (error) {
        console.error("Failed to fetch teams:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeams()
  }, [])

  return (
    <div className="p-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-label">Teams</h3>
        <Button variant="ghost" size="sm" className="p-1 h-6 w-6" onClick={onCreateTeam}>
          <Plus size={12} />
        </Button>
      </div>
      <div className="space-y-2">
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))
        ) : teams.length > 0 ? (
          teams.map((team: any) => (
            <Link
              href={`/chat/${team.id}`}
              key={team.id}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-small font-medium">{team.teamName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-medium truncate">{team.teamName}</p>
                <p className="text-muted-small">{team.memberCount || 0} members</p>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-small">No teams yet</p>
            <Button variant="ghost" size="sm" onClick={onCreateTeam} className="mt-2">
              <Plus size={12} className="mr-1" />
              <span className="text-small">Create first team</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


export default TeamsSection
