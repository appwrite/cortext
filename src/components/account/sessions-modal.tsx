import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAccountClient, getAvatarsClient } from '@/lib/appwrite'
import { toast } from '@/hooks/use-toast'
import { Monitor, Smartphone, Globe, LogOut } from 'lucide-react'
import { Models } from 'appwrite'

interface SessionsModalProps {
  isOpen: boolean
  onClose: () => void
}

type Session = Models.Session

export function SessionsModal({ isOpen, onClose }: SessionsModalProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  // Load sessions when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSessions()
    }
  }, [isOpen])

  const loadSessions = async () => {
    setIsLoadingSessions(true)
    try {
      const account = getAccountClient()
      const sessionsList = await account.listSessions()
      setSessions(sessionsList.sessions)
    } catch (error: any) {
      toast({
        title: 'Failed to load sessions',
        description: error.message || 'Could not load session information',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      const account = getAccountClient()
      await account.deleteSession(sessionId)
      setSessions(sessions.filter(session => session.$id !== sessionId))
      toast({
        title: "Session ended",
        description: "The session has been successfully ended.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to end session.",
        variant: "destructive",
      })
    }
  }

  const getDeviceIcon = (clientType: string) => {
    switch (clientType) {
      case 'desktop':
        return <Monitor className="h-4 w-4" />
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getBrowserIcon = (clientCode: string) => {
    if (!clientCode) return null
    const avatars = getAvatarsClient()
    return avatars.getBrowser(clientCode as any, 48, 48)
  }

  const formatDate = (dateString: string) => {
    const now = new Date()
    const sessionDate = new Date(dateString)
    const diffInMs = now.getTime() - sessionDate.getTime()
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

    // Check if it's today (same calendar day)
    const isToday = now.toDateString() === sessionDate.toDateString()
    if (isToday) {
      return 'Today'
    }

    // Check if it's yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = yesterday.toDateString() === sessionDate.toDateString()
    if (isYesterday) {
      return 'Yesterday'
    }

    // Show "days ago" for sessions 2-6 days old
    if (diffInDays < 7) {
      const days = Math.floor(diffInDays)
      return `${days}d ago`
    }

    // Show date for older sessions
    return sessionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">Active Sessions</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active sessions found.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Device & Browser</th>
                    <th className="text-left p-3 font-medium">Location</th>
                    <th className="text-left p-3 font-medium">Last Active</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.$id} className="border-t hover:bg-muted/25">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {session.clientCode && (
                            <img 
                              src={getBrowserIcon(session.clientCode) || undefined} 
                              alt={session.clientName || 'Browser'}
                              className="w-8 h-8 rounded-sm"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {session.deviceName || `${session.clientName} ${session.clientVersion}`}
                              </span>
                              {session.current && (
                                <Badge variant="default" className="text-xs">Current</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {session.osName} {session.osVersion}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <span className="text-sm">{session.countryName || 'Unknown'}</span>
                          <p className="text-xs font-mono text-muted-foreground mt-1">
                            {session.ip}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(session.$createdAt)}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {!session.current && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSession(session.$id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <LogOut className="h-3 w-3 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
