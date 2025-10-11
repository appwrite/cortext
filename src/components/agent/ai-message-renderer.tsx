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

  // Try to find JSON anywhere in the content (new format: explanatory text → JSON → confirmation)
  let jsonMatch = content.match(/^\{[\s\S]*?\}\n/)
  
  // If not found at beginning, look for JSON anywhere in the content
  if (!jsonMatch) {
    jsonMatch = content.match(/^\{[\s\S]*?\}(?=\n|$)/)
  }
  
  if (!jsonMatch) {
    jsonMatch = content.match(/^\{[\s\S]*?\}/)
  }
  
  // If still not found, look for JSON anywhere in the content
  if (!jsonMatch) {
    // Look for JSON objects that start with { and end with }
    jsonMatch = content.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/)
  }
  
  // If still not found, try a more aggressive approach
  if (!jsonMatch) {
    const lines = content.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('{') && trimmedLine.includes('}')) {
        // Try to find the complete JSON object
        const startIndex = content.indexOf(trimmedLine)
        let braceCount = 0
        let endIndex = startIndex
        
        for (let i = startIndex; i < content.length; i++) {
          if (content[i] === '{') braceCount++
          if (content[i] === '}') braceCount--
          if (braceCount === 0) {
            endIndex = i
            break
          }
        }
        
        if (braceCount === 0) {
          jsonMatch = [content.substring(startIndex, endIndex + 1)]
          break
        }
      }
    }
  }
  
  if (!jsonMatch) {
    // No JSON found, render as regular markdown with better styling
    return (
      <div className={cn("space-y-1 text-xs leading-relaxed", className)}>
        {content}
      </div>
    )
  }
  
  if (jsonMatch) {
    // Complete JSON found
    const jsonStr = jsonMatch[0].trim()
    
    // Extract explanation text (comes after JSON in new format)
    const jsonEndIndex = content.indexOf(jsonStr) + jsonStr.length
    const explanation = content.slice(jsonEndIndex).trim()
    
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
      // If JSON is empty (like {}), hide it and only show explanation if it exists
      if (Object.keys(parsed).length === 0) {
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

