import React, { useState, useRef, useEffect } from 'react'
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AICommand {
  type: 'article' | 'sections'
  data: any
}

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

  // Try to extract JSON from the beginning of the message
  const jsonMatch = content.match(/^\{[\s\S]*?\}\n/)
  const hasJson = !!jsonMatch
  
  if (!hasJson) {
    return null // No JSON found, no changes to show
  }

  const jsonStr = jsonMatch[0].trim()
  
  let commands: AICommand[] = []
  try {
    const parsed = JSON.parse(jsonStr)
    if (parsed.article) {
      commands.push({ type: 'article', data: parsed.article })
    }
    if (parsed.sections) {
      commands.push({ type: 'sections', data: parsed.sections })
    }
  } catch (error) {
    return null // If JSON parsing fails, don't show indicators
  }

  if (commands.length === 0) {
    return null
  }

  return (
    <div className={cn("mt-1 ml-6 space-y-1 max-w-[220px]", className)}>
      {commands.map((command, index) => (
        <CommandRenderer key={index} command={command} isStreaming={isStreaming} />
      ))}
    </div>
  )
}

function CommandRenderer({ command, isStreaming }: { command: AICommand; isStreaming: boolean }) {
  if (command.type === 'article') {
    return <ArticleChanges data={command.data} isStreaming={isStreaming} />
  }
  
  if (command.type === 'sections') {
    return <SectionChanges data={command.data} isStreaming={isStreaming} />
  }
  
  return null
}

function ArticleChanges({ data, isStreaming }: { data: any; isStreaming: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCollapseButton, setShowCollapseButton] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const changes = Object.entries(data).map(([key, value]) => ({
    field: key,
    value: value,
    label: getFieldLabel(key)
  }))

  const changesText = changes.map(change => `${change.label}: ${typeof change.value === 'string' ? `"${change.value}"` : String(change.value)}`).join(', ')

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
  }, [changesText])

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
              !isExpanded && "line-clamp-2"
            )} ref={contentRef}>
              Article: {changesText}
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
    case 'update': return 'Updated'
    case 'delete': return 'Removed'
    case 'move': return 'Moved'
    default: return 'Modified'
  }
}

function getTypeText(type: string) {
  switch (type) {
    case 'text': return 'text section'
    case 'title': return 'title'
    case 'code': return 'code block'
    case 'image': return 'image'
    case 'quote': return 'quote'
    default: return 'section'
  }
}

function SectionChanges({ data, isStreaming }: { data: any[]; isStreaming: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCollapseButton, setShowCollapseButton] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const changes = data.map((section, index) => ({
    ...section,
    id: section.id || `section-${index}`
  }))

  const changesText = changes.map(change => {
    const actionText = getActionText(change.action)
    const typeText = getTypeText(change.type)
    const contentText = change.content ? `"${change.content.length > 20 ? change.content.substring(0, 20) + '...' : change.content}"` : ''
    return `${actionText} ${typeText}${contentText ? ` ${contentText}` : ''}`
  }).join(', ')

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
  }, [changesText])

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
              !isExpanded && "line-clamp-2"
            )} ref={contentRef}>
              Content: {changesText}
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
