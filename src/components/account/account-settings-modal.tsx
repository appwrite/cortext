import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAccountClient } from '@/lib/appwrite'
import { toast } from '@/hooks/use-toast'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccountSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    $id?: string
    name?: string
    email?: string
    $createdAt?: string
    emailVerification?: boolean
    phoneVerification?: boolean
  } | null
  onSignOut: () => void
}


export function AccountSettingsModal({ isOpen, onClose, user, onSignOut }: AccountSettingsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Form states
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || '')
    }
  }, [user])


  const updateName = async () => {
    if (!name.trim()) return
    
    setIsUpdating(true)
    try {
      const account = getAccountClient()
      await account.updateName({ name: name.trim() })
      toast({
        title: 'Name updated',
        description: 'Your name has been updated successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Failed to update name',
        description: error.message || 'Could not update your name',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }


  const updatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword || !currentPassword) return
    
    setIsUpdating(true)
    try {
      const account = getAccountClient()
      await account.updatePassword({ 
        password: newPassword,
        oldPassword: currentPassword
      })
      toast({
        title: 'Password updated',
        description: 'Your password has been updated successfully'
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast({
        title: 'Failed to update password',
        description: error.message || 'Could not update your password',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">Account Settings</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {/* Profile Information */}
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="name">Display Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="flex-1"
                      />
                      <Button 
                        onClick={updateName} 
                        disabled={isUpdating || !name.trim()}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Password Change */}
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="current-password" className="text-sm">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPasswords.current ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="h-9"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="new-password" className="text-sm">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPasswords.new ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="h-9"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="confirm-password" className="text-sm">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="h-9"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={updatePassword} 
                    disabled={isUpdating || !newPassword || newPassword !== confirmPassword || !currentPassword}
                    className="w-full"
                  >
                    {isUpdating ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
