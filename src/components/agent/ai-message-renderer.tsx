import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { JSONProcessingIndicator } from './json-processing-indicator'

interface AIMessageRendererProps {
  content: string
  className?: string
}

/**
 * Renders AI messages with special handling for JSON commands
 * Shows a nice visual indication of changes made instead of raw JSON
 */
export const AIMessageRenderer = memo(function AIMessageRenderer({ content, className }: AIMessageRendererProps) {
  if (!content) return null

  // Check if content starts with JSON-like structure (even if incomplete)
  const hasJsonStart = content.trim().startsWith('{')
  
  if (!hasJsonStart) {
    // No JSON found, render as regular markdown with better styling
    return (
      <div className={cn("space-y-1 text-xs leading-relaxed", className)}>
        {content}
      </div>
    )
  }

  // Try to find complete JSON first
  const jsonMatch = content.match(/^\{[\s\S]*?\}\n/)
  
  if (jsonMatch) {
    // Complete JSON found
    const jsonStr = jsonMatch[0].trim()
    const explanation = content.slice(jsonMatch[0].length).trim()
    
    try {
      const parsed = JSON.parse(jsonStr)
      // If JSON is valid and has commands, only show explanation if it exists
      if (parsed.article || parsed.sections) {
        return (
          <div className={cn("space-y-1", className)}>
            {/* Only show explanation if there's meaningful content after JSON */}
            {explanation && explanation.trim() && (
              <div className="text-xs leading-relaxed">
                {explanation}
              </div>
            )}
          </div>
        )
      }
    } catch (error) {
      // If JSON parsing fails, fall back to regular content
      return <div className={cn("space-y-1 text-xs leading-relaxed", className)}>{content}</div>
    }
  } else {
    // Incomplete JSON detected - show processing indicator
    // This handles the streaming case where JSON is being built
    const firstNewline = content.indexOf('\n')
    if (firstNewline > 0) {
      // There's a newline, check if there's content after it
      const afterNewline = content.slice(firstNewline + 1).trim()
      if (afterNewline) {
        // Show processing indicator and the content after the newline (explanation)
        return (
          <div className={cn("space-y-2", className)}>
            <JSONProcessingIndicator content={content} />
            <div className="text-xs leading-relaxed">
              {afterNewline}
            </div>
          </div>
        )
      }
    }
    
    // No newline yet or no content after newline - show processing indicator during streaming
    return (
      <div className={cn("space-y-1", className)}>
        <JSONProcessingIndicator content={content} />
      </div>
    )
  }

  // Fallback - show regular content
  return (
    <div className={cn("space-y-1 text-xs leading-relaxed", className)}>
      {content}
    </div>
  )
})

