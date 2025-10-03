import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getTeamsClient } from '@/lib/appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
import { 
  Loader2,
  Save
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TeamSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  team: any | null
  userId: string
}

export function TeamSettingsModal({ isOpen, onClose, team, userId }: TeamSettingsModalProps) {
  const [teamName, setTeamName] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const queryClient = useQueryClient()

  // Initialize form with team data
  useEffect(() => {
    if (team) {
      setTeamName(team.name || '')
    }
  }, [team])

  const updateTeamMutation = useMutation({
    mutationFn: async () => {
      const teamsClient = getTeamsClient()
      
      // Update team name in Appwrite
      await teamsClient.updateName(team.$id, teamName)
      
      return team
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', userId] })
      toast({ title: 'Team updated successfully!' })
      handleClose()
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update team', 
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  const handleClose = () => {
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName.trim()) return

    setIsUpdating(true)
    try {
      await updateTeamMutation.mutateAsync()
    } finally {
      setIsUpdating(false)
    }
  }

  if (!team) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Team Settings
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!teamName.trim() || isUpdating}
              className="flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}