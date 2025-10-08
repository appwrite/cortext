import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Trash2, History } from 'lucide-react'
import { useRevisionHistory } from '@/hooks/use-revisions'
import { formatDateRelative } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface RevisionPopoverProps {
  articleId: string
  currentRevisionId?: string | null
  onSelectRevision?: (revisionId: string) => void
  onDeleteRevision?: (revisionId: string) => void
  onRevertToRevision?: (revisionId: string) => void
  onScrollToTop?: () => void
  className?: string
  currentRevisionVersion?: number
}

export function RevisionPopover({
  articleId,
  currentRevisionId,
  onSelectRevision,
  onDeleteRevision,
  onRevertToRevision,
  onScrollToTop,
  className,
  currentRevisionVersion
}: RevisionPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [revisionToDelete, setRevisionToDelete] = useState<string | null>(null)
  const { revisionHistory, isLoading } = useRevisionHistory(articleId)

  const handleDeleteRevision = (revisionId: string) => {
    setRevisionToDelete(revisionId)
  }

  const confirmDelete = () => {
    if (revisionToDelete && onDeleteRevision) {
      onDeleteRevision(revisionToDelete)
      setRevisionToDelete(null)
    }
  }

  const getRevisionTitle = (revision: any) => {
    const truncate = (text: string, maxLength: number = 50) => {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    if (revision.isInitial) {
      return `Version ${revision.version} - Initial`
    }
    
    const changes = revision.changes || []
    if (changes.length === 0) return `Version ${revision.version}`
    
    // Get the first meaningful change
    const firstChange = changes[0]
    if (firstChange.includes('Updated title:')) {
      const titleChange = firstChange.split('Updated title: ')[1]
      const newTitle = titleChange.split(' → ')[1] || titleChange
      return `Version ${revision.version} - Title: ${truncate(newTitle, 30)}`
    }
    if (firstChange.includes('Section')) {
      const sectionInfo = firstChange.split(': ')[0]
      return `Version ${revision.version} - ${truncate(sectionInfo, 40)}`
    }
    if (firstChange.includes('Updated')) {
      const field = firstChange.split('Updated ')[1].split(':')[0]
      return `Version ${revision.version} - Updated ${truncate(field, 30)}`
    }
    
    return `Version ${revision.version}`
  }


  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 text-xs hover:bg-accent",
              className
            )}
          >
            <History className="h-3 w-3 mr-1" />
            Revisions
            {currentRevisionVersion && (
              <span className="ml-1 text-muted-foreground/60">
                v{currentRevisionVersion}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[28rem] p-0" align="start">
          {/* Arrow pointing down to button - matching other popovers */}
          <div className="absolute left-3 bottom-0 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-border translate-y-full" />
          
          <div className="px-3 py-2 border-b">
            <h4 className="font-medium text-sm">Revision History</h4>
            <p className="text-xs text-muted-foreground">
              Showing last {revisionHistory.length} revision{revisionHistory.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <ScrollArea className="h-64">
            {isLoading ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Loading revisions...
              </div>
            ) : revisionHistory.length === 0 ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                No revisions yet
              </div>
            ) : (
              <div className="p-1 space-y-0.5">
                {revisionHistory.map((revision) => (
                  <div
                    key={revision.$id}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-accent transition-colors",
                      revision.$id === currentRevisionId ? "bg-secondary" : ""
                    )}
                  >
                    {/* Revision info */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer pr-2"
                      onClick={() => {
                        if (onRevertToRevision && revision.$id !== currentRevisionId) {
                          onRevertToRevision(revision.$id)
                        } else if (onSelectRevision) {
                          onSelectRevision(revision.$id)
                        }
                        setIsOpen(false)
                        // Scroll to top when revision is selected
                        onScrollToTop?.()
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 leading-5">
                          <div 
                            className="text-xs truncate"
                            title={getRevisionTitle(revision)}
                          >
                            {getRevisionTitle(revision)}
                          </div>
                          {revision.$id === currentRevisionId && (
                            <span className="text-xs text-green-600">
                              Current
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground leading-5">
                          <span>{revision.createdBy ? `User ${revision.createdBy.slice(-4)}` : 'Unknown'}</span>
                          <span className="mx-1">•</span>
                          <span>{formatDateRelative(revision.timestamp)}</span>
                          {revision.changes && revision.changes.length > 0 && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{revision.changes.length} change{revision.changes.length !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                      {onDeleteRevision && 
                       !revision.isInitial && 
                       revision.$id !== currentRevisionId && 
                       revisionHistory.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRevision(revision.$id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!revisionToDelete} onOpenChange={() => setRevisionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Revision</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this revision? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
