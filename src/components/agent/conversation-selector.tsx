import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { ChevronDown, Plus, Edit2, Trash2 } from 'lucide-react'
import type { Conversations } from '@/lib/appwrite/appwrite.types'
import { formatDateRelative } from '@/lib/date-utils'

interface ConversationSelectorProps {
  conversations: Conversations[]
  currentConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onCreateNewConversation: () => void
  onEditConversation?: (conversationId: string, newTitle: string) => void
  onDeleteConversation?: (conversationId: string) => void
  isLoading?: boolean
}

export function ConversationSelector({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateNewConversation,
  onEditConversation,
  onDeleteConversation,
  isLoading = false,
}: ConversationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingConversation, setEditingConversation] = useState<Conversations | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingConversation, setDeletingConversation] = useState<Conversations | null>(null)

  const currentConversation = conversations.find(c => c.$id === currentConversationId)

  const handleEditClick = (conversation: Conversations) => {
    setEditingConversation(conversation)
    setEditTitle(conversation.title)
    setIsEditModalOpen(true)
    setIsOpen(false)
  }

  const handleEditSave = () => {
    if (editingConversation && editTitle.trim() && editTitle.trim() !== editingConversation.title) {
      onEditConversation?.(editingConversation.$id, editTitle.trim())
    }
    setIsEditModalOpen(false)
    setEditingConversation(null)
    setEditTitle('')
  }

  const handleEditCancel = () => {
    setIsEditModalOpen(false)
    setEditingConversation(null)
    setEditTitle('')
  }

  const handleDeleteClick = (conversation: Conversations) => {
    setDeletingConversation(conversation)
    setIsDeleteDialogOpen(true)
    setIsOpen(false)
  }

  const handleDeleteConfirm = () => {
    if (deletingConversation) {
      onDeleteConversation?.(deletingConversation.$id)
    }
    setIsDeleteDialogOpen(false)
    setDeletingConversation(null)
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setDeletingConversation(null)
  }

  return (
    <div className="flex items-center gap-1 w-full">
      {/* Conversation selector - takes full width */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 flex-1 justify-between min-w-0"
            disabled={isLoading}
            title="Select conversation"
          >
            <span className="text-xs font-medium text-muted-foreground truncate">
              {currentConversation?.title || 'No conversation'}
            </span>
            <ChevronDown className="h-4 w-4 flex-shrink-0 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          {/* Arrow pointing to the conversation selector */}
          <div className="absolute right-3 top-0 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-border -translate-y-full" />
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Conversations</h4>
            </div>
          </div>
          <ScrollArea className="max-h-64">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.$id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors ${
                      conversation.$id === currentConversationId ? "bg-secondary" : ""
                    }`}
                  >
                    {/* Conversation name card */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        console.log('🔄 Switching to conversation:', conversation.$id, conversation.title)
                        onSelectConversation(conversation.$id)
                        setIsOpen(false)
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-medium text-sm"
                          title={conversation.title}
                        >
                          {conversation.title.length > 20 
                            ? `${conversation.title.substring(0, 20)}...` 
                            : conversation.title
                          }
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {conversation.lastMessageAt 
                            ? formatDateRelative(conversation.lastMessageAt)
                            : 'No messages'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons - outside the name card */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {onEditConversation && (
                        <button
                          className="h-7 w-7 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center group opacity-0 group-hover:opacity-100 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(conversation)
                          }}
                          title="Edit conversation"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        </button>
                      )}
                      {onDeleteConversation && (
                        <button
                          className="h-7 w-7 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center group opacity-0 group-hover:opacity-100 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(conversation)
                          }}
                          title="Delete conversation"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* New conversation button - aligned to the end */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 flex-shrink-0"
        onClick={onCreateNewConversation}
        disabled={isLoading}
        title="New conversation"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* Edit Conversation Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="conversation-title" className="text-sm font-medium">
                Conversation Title
              </label>
              <Input
                id="conversation-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter conversation title"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditSave()
                  } else if (e.key === 'Escape') {
                    handleEditCancel()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleEditCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditSave}
              disabled={!editTitle.trim() || editTitle.trim() === editingConversation?.title}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingConversation?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
