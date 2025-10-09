import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trash2, History, Code } from 'lucide-react'
import { useRevisionHistory } from '@/hooks/use-revisions'
import { formatDateRelative } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface RevisionPopoverProps {
  articleId: string
  currentRevisionId?: string | null
  formRevisionId?: string | null
  onSelectRevision?: (revisionId: string) => void
  onDeleteRevision?: (revisionId: string) => void
  onRevertToRevision?: (revisionId: string) => void
  onScrollToTop?: () => void
  className?: string
  currentRevisionVersion?: number
  debugMode?: boolean
}

export function RevisionPopover({
  articleId,
  currentRevisionId,
  formRevisionId,
  onSelectRevision,
  onDeleteRevision,
  onRevertToRevision,
  onScrollToTop,
  className,
  currentRevisionVersion,
  debugMode = false
}: RevisionPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [revisionToDelete, setRevisionToDelete] = useState<string | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<'bottom' | 'top'>('bottom')
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false)
  const [selectedRevisionForJson, setSelectedRevisionForJson] = useState<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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

  const handleViewJson = (revision: any) => {
    setSelectedRevisionForJson(revision)
    setJsonDialogOpen(true)
  }

  // Calculate popover position and height
  const calculatePosition = () => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const stickyFooterHeight = 80; // Height of sticky footer
      const headerHeight = 60; // Height of top header
      const padding = 20; // Some padding for safety
      const popoverHeight = 400; // Estimated popover height
      
      const availableSpaceBelow = viewportHeight - containerRect.bottom - stickyFooterHeight - padding;
      const availableSpaceAbove = containerRect.top - headerHeight - padding;
      
      // Determine if we should open above or below
      if (availableSpaceBelow < popoverHeight && availableSpaceAbove > availableSpaceBelow) {
        setPopoverPosition('top');
      } else {
        setPopoverPosition('bottom');
      }
    }
  };

  const getMaxPopoverHeight = () => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const stickyFooterHeight = 80; // Height of sticky footer
      const headerHeight = 60; // Height of top header
      const padding = 20; // Some padding for safety
      
      const availableSpaceBelow = viewportHeight - containerRect.bottom - stickyFooterHeight - padding;
      const availableSpaceAbove = containerRect.top - headerHeight - padding;
      
      // Use the appropriate space based on position
      const availableSpace = popoverPosition === 'top' ? availableSpaceAbove : availableSpaceBelow;
      const maxHeight = Math.max(200, Math.min(400, availableSpace));
      
      return maxHeight;
    }
    return 300; // Fallback height
  };

  // Calculate position when opening and on window resize
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen]);

  // Recalculate position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

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
    <div ref={containerRef} className="relative">
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
        <PopoverContent 
          className="w-[28rem] p-0 bg-background border rounded-lg shadow-lg" 
          align="start"
          side={popoverPosition}
        >
          {/* Arrow pointing down to button */}
          <div className="absolute left-3 bottom-0 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-border translate-y-full" />
          
          <div className="px-3 py-2 border-b">
            <h4 className="font-medium text-sm">Revision History</h4>
            <p className="text-xs text-muted-foreground">
              Showing last {revisionHistory.length} revision{revisionHistory.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <ScrollArea style={{ height: `${getMaxPopoverHeight()}px` }}>
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
                      revision.$id === formRevisionId ? "bg-secondary" : ""
                    )}
                  >
                    {/* Revision info */}
                    <div
                      className={cn(
                        "flex-1 min-w-0 pr-2",
                        revision.$id === formRevisionId && revision.$id !== currentRevisionId 
                          ? "cursor-not-allowed opacity-60" 
                          : "cursor-pointer"
                      )}
                      onClick={() => {
                        // Don't allow clicking on revisions marked as "Editing"
                        if (revision.$id === formRevisionId && revision.$id !== currentRevisionId) {
                          return
                        }
                        
                        if (onRevertToRevision && revision.$id !== formRevisionId) {
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
                          <div className="flex items-center gap-1">
                            {revision.$id === currentRevisionId && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                                Active
                              </span>
                            )}
                            {revision.$id === formRevisionId && (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                Editing
                              </span>
                            )}
                          </div>
                        </div>
                        
                          <div className="text-xs text-muted-foreground leading-5">
                            <span>{revision.userName || revision.userEmail || 'Unknown'}</span>
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
                      {/* JSON View Button - Only visible in debug mode */}
                      {debugMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-purple-600 bg-purple-100 hover:bg-purple-200 dark:text-purple-400 dark:bg-purple-900 dark:hover:bg-purple-800"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewJson(revision)
                          }}
                          title="View JSON data"
                        >
                          <Code className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      
                      {onDeleteRevision && 
                       !revision.isInitial && 
                       revision.$id !== currentRevisionId && 
                       revision.$id !== formRevisionId && 
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

      {/* JSON Data Dialog */}
      <Dialog open={jsonDialogOpen} onOpenChange={setJsonDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
          <DialogHeader>
            <DialogTitle className="text-purple-800 dark:text-purple-200">
              Revision JSON Data - Version {selectedRevisionForJson?.version}
            </DialogTitle>
            <div className="text-sm text-purple-600 dark:text-purple-400 font-mono">
              ID: {selectedRevisionForJson?.$id}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[60vh] w-full">
              <pre className="text-xs bg-purple-100 dark:bg-purple-900 p-4 rounded-md overflow-auto text-purple-800 dark:text-purple-200">
                {selectedRevisionForJson ? JSON.stringify(selectedRevisionForJson, null, 2) : ''}
              </pre>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
