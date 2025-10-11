import React, { useState, useRef, useEffect, useMemo } from 'react'
import { CheckCircle, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIChangeIndicatorsProps {
  content: string
  isStreaming?: boolean
  className?: string
}

/**
 * Displays AI change indicators outside the message bubble
 * Shows a clean list of changes made by the AI
 */
export function AIChangeIndicators({ content, isStreaming = false, className }: AIChangeIndicatorsProps) {
  if (!content) return null

  // Try to find ALL JSON objects in the content (new format: explanatory text → JSON → confirmation)
  const findAllJsonObjects = (content: string) => {
    const jsonObjects: string[] = [];
    let searchIndex = 0;
    
    while (searchIndex < content.length) {
      const startIndex = content.indexOf('{', searchIndex);
      if (startIndex === -1) break;
      
      let braceCount = 0;
      let endIndex = startIndex;
      
      for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
      
      if (braceCount === 0) {
        const jsonStr = content.substring(startIndex, endIndex + 1).trim();
        // Try to parse to validate it's valid JSON
        try {
          JSON.parse(jsonStr);
          jsonObjects.push(jsonStr);
        } catch (e) {
          // Skip invalid JSON
        }
        searchIndex = endIndex + 1;
      } else {
        searchIndex = startIndex + 1;
      }
    }
    
    return jsonObjects;
  };
  
  const allJsonObjects = findAllJsonObjects(content);
  const hasJson = allJsonObjects.length > 0;
  
  if (!hasJson) {
    return null // No JSON found, no changes to show
  }

  const allChanges = useMemo(() => {
    let changes: any[] = []
    
    // Process all JSON objects
    for (const jsonStr of allJsonObjects) {
      try {
        const parsed = JSON.parse(jsonStr)
        
        // Add article changes
        if (parsed.article) {
          const articleChanges = Object.entries(parsed.article).map(([key, value]) => ({
            type: 'article',
            field: key,
            value: value,
            label: getFieldLabel(key)
          }))
          changes.push(...articleChanges)
        }
        
        // Add section changes
        if (parsed.sections) {
          const sectionChanges = parsed.sections.map((section: any, index: number) => ({
            type: 'section',
            id: section.id || `section-${index}`,
            action: section.action,
            sectionType: section.type,
            content: section.content
          }))
          changes.push(...sectionChanges)
        }
      } catch (error) {
        // Skip invalid JSON objects
        continue
      }
    }
    
    return changes
  }, [allJsonObjects])

  if (allChanges.length === 0) {
    return null
  }

  return (
    <div className={cn("mt-1 ml-6 space-y-1 max-w-[220px]", className)}>
      <CombinedChangesRenderer key={allChanges.length} changes={allChanges} isStreaming={isStreaming} />
    </div>
  )
}

function CombinedChangesRenderer({ changes, isStreaming }: { changes: any[]; isStreaming: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const maxVisible = 3
  const visibleChanges = isExpanded ? changes : changes.slice(0, maxVisible)
  const hiddenCount = changes.length - maxVisible

  return (
    <div className="space-y-1">
      {visibleChanges.map((change, index) => (
        <ChangeRenderer key={index} change={change} isStreaming={isStreaming} />
      ))}
      {!isExpanded && hiddenCount > 0 && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center gap-1.5 p-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <MoreHorizontal className="h-3 w-3" />
          {hiddenCount} more
        </button>
      )}
      {isExpanded && changes.length > maxVisible && (
        <button
          onClick={() => setIsExpanded(false)}
          className="w-full flex items-center gap-1.5 p-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronUp className="h-3 w-3" />
          Show less
        </button>
      )}
    </div>
  )
}

function ChangeRenderer({ change, isStreaming }: { change: any; isStreaming: boolean }) {
  if (change.type === 'article') {
    return <ArticleFieldChange change={change} isStreaming={isStreaming} />
  }
  
  if (change.type === 'section') {
    return <SectionChange change={change} isStreaming={isStreaming} />
  }
  
  return null
}

function ArticleFieldChange({ change, isStreaming }: { change: { field: string; value: any; label: string }; isStreaming: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCollapseButton, setShowCollapseButton] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const changeText = `${change.label}: ${typeof change.value === 'string' ? `"${change.value}"` : String(change.value)}`

  useEffect(() => {
    const checkIfTruncated = () => {
      if (contentRef.current) {
        // Check if the element has overflow (scrollHeight > clientHeight)
        // This indicates that line-clamp is actually truncating content
        const hasOverflow = contentRef.current.scrollHeight > contentRef.current.clientHeight
        setShowCollapseButton(hasOverflow)
      }
    }

    // Use a small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(checkIfTruncated, 0)
    
    // Re-check on window resize
    window.addEventListener('resize', checkIfTruncated)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkIfTruncated)
    }
  }, [changeText])

  return (
    <div className="bg-green-50 dark:bg-green-950/20 rounded-md p-2.5">
      <div className="flex items-start gap-2 text-xs text-green-800 dark:text-green-200">
        {isStreaming ? (
          <div className="h-3 w-3 border-2 border-green-600 dark:border-green-400 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" style={{ animationDuration: '1s' }}></div>
        ) : (
          <CheckCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className={cn(
              "flex-1 min-w-0",
              !isExpanded && "line-clamp-1"
            )} ref={contentRef}>
              {changeText}
            </div>
            {showCollapseButton && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex-shrink-0 ml-1 p-0.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors cursor-pointer"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getActionText(action: string) {
  switch (action) {
    case 'create': return 'Added'
    case 'update': return ''
    case 'delete': return 'Removed'
    case 'move': return 'Moved'
    default: return 'Modified'
  }
}

function getTypeText(type: string) {
  switch (type) {
    case 'text': return 'Text'
    case 'title': return 'Title'
    case 'code': return 'Code'
    case 'image': return 'Image'
    case 'quote': return 'Quote'
    default: return 'Content'
  }
}

function SectionChange({ change, isStreaming }: { change: any; isStreaming: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCollapseButton, setShowCollapseButton] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const actionText = getActionText(change.action)
  const typeText = getTypeText(change.sectionType)
  const contentText = change.content ? `"${change.content.length > 20 ? change.content.substring(0, 20) + '...' : change.content}"` : ''
  
  // Create breadcrumb-style format: Body > Type
  const breadcrumbText = `Body > ${typeText.charAt(0).toUpperCase() + typeText.slice(1)}`
  const changeText = actionText ? `${breadcrumbText}${contentText ? ` ${contentText}` : ''}` : `${breadcrumbText}${contentText ? ` ${contentText}` : ''}`

  useEffect(() => {
    const checkIfTruncated = () => {
      if (contentRef.current) {
        // Check if the element has overflow (scrollHeight > clientHeight)
        // This indicates that line-clamp is actually truncating content
        const hasOverflow = contentRef.current.scrollHeight > contentRef.current.clientHeight
        setShowCollapseButton(hasOverflow)
      }
    }

    // Use a small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(checkIfTruncated, 0)
    
    // Re-check on window resize
    window.addEventListener('resize', checkIfTruncated)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkIfTruncated)
    }
  }, [changeText])

  return (
    <div className="bg-green-50 dark:bg-green-950/20 rounded-md p-2.5">
      <div className="flex items-start gap-2 text-xs text-green-800 dark:text-green-200">
        {isStreaming ? (
          <div className="h-3 w-3 border-2 border-green-600 dark:border-green-400 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" style={{ animationDuration: '1s' }}></div>
        ) : (
          <CheckCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className={cn(
              "flex-1 min-w-0",
              !isExpanded && "line-clamp-1"
            )} ref={contentRef}>
              {changeText}
            </div>
            {showCollapseButton && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex-shrink-0 ml-1 p-0.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors cursor-pointer"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    title: 'Title',
    subtitle: 'Subtitle',
    trailer: 'Trailer',
    status: 'Status',
    live: 'Live',
    pinned: 'Pinned',
    redirect: 'Redirect',
    slug: 'Slug',
    authors: 'Authors',
    categories: 'Categories',
    images: 'Images',
    blogId: 'Blog'
  }
  return labels[field] || field
}
