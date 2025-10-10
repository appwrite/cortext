import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getTeamsClient } from '@/lib/appwrite'
import { db } from '@/lib/appwrite/db'
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
  Plus, 
  X, 
  Mail, 
  UserPlus,
  Loader2 
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ID } from 'appwrite'

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onTeamCreated?: (team: any, blog: any) => void
}

interface TeamMember {
  email: string
  role: string
}

export function CreateTeamModal({ isOpen, onClose, userId, onTeamCreated }: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState<TeamMember[]>([{ email: '', role: 'member' }])
  const [isCreating, setIsCreating] = useState(false)
  const queryClient = useQueryClient()

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const teamsClient = getTeamsClient()
      
      // Create the team in Appwrite
      const team = await teamsClient.create(ID.unique(), teamName)

      // Invite members
      const validMembers = members.filter(m => m.email.trim())
      for (const member of validMembers) {
        try {
          await teamsClient.createMembership(
            team.$id,
            [member.role],
            member.email,
            `${window.location.origin}/content?team=${team.$id}`
          )
        } catch (error) {
          console.warn(`Failed to invite ${member.email}:`, error)
          // Continue with other members even if one fails
        }
      }

      // Create a default blog for the team
      const blog = await db.blogs.create({
        name: 'New blog',
        slug: 'new-blog',
        description: null,
        domain: null,
        logo: null,
        favicon: null,
        theme: null,
        settings: null,
        ownerId: userId,
        teamId: team.$id,
        status: 'active',
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null
      }, team.$id)

      return { team, blog }
    },
    onSuccess: ({ team, blog }) => {
      queryClient.invalidateQueries({ queryKey: ['teams', userId] })
      queryClient.invalidateQueries({ queryKey: ['blogs', team.$id] })
      toast({ title: 'Team and blog created successfully!' })
      
      // Call the callback to update the top navigation
      if (onTeamCreated) {
        onTeamCreated(team, blog)
      }
      
      handleClose()
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to create team', 
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  const handleClose = () => {
    setTeamName('')
    setMembers([{ email: '', role: 'member' }])
    onClose()
  }

  const addMember = () => {
    setMembers([...members, { email: '', role: 'member' }])
  }

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...members]
    updated[index] = { ...updated[index], [field]: value }
    setMembers(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName.trim()) return

    setIsCreating(true)
    try {
      await createTeamMutation.mutateAsync()
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Create New Team
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

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Team Members</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMember}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Member
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {members.map((member, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="member@example.com"
                          value={member.email}
                          onChange={(e) => updateMember(index, 'email', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <select
                        value={member.role}
                        onChange={(e) => updateMember(index, 'role', e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-md"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                    </div>
                    {members.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!teamName.trim() || isCreating}
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Team
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
