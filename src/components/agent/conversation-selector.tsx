import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, MessageCircle, Plus, ChevronRight } from 'lucide-react'
import type { Conversations } from '@/lib/appwrite/appwrite.types'

interface ConversationSelectorProps {
  conversations: Conversations[]
  currentConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onCreateNewConversation: () => void
  isLoading?: boolean
}

export function ConversationSelector({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateNewConversation,
  isLoading = false,
}: ConversationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentConversation = conversations.find(c => c.$id === currentConversationId)

  return (
    <>
      {/* Conversation title - left aligned */}
      <div className="text-xs font-medium text-muted-foreground truncate max-w-32">
        {currentConversation?.title || 'No conversation'}
      </div>

      {/* Buttons - right aligned */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Conversation selector - arrow only */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={isLoading}
              title="Select conversation"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
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
                  <Button
                    key={conversation.$id}
                    variant={conversation.$id === currentConversationId ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-between h-auto px-3 py-2 text-left"
                    onClick={() => {
                      onSelectConversation(conversation.$id)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-sm">
                        {conversation.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(conversation.$createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-2" />
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* New conversation button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onCreateNewConversation}
        disabled={isLoading}
        title="New conversation"
      >
        <Plus className="h-4 w-4" />
      </Button>
      </div>
    </>
  )
}
