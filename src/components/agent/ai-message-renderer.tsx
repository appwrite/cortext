import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { JSONProcessingIndicator } from './json-processing-indicator'
import { AIChangeIndicators } from './ai-change-indicators'

interface AIMessageRendererProps {
  content: string
  className?: string
  isStreaming?: boolean
}

/**
 * Renders AI messages with special handling for JSON commands
 * Shows a nice visual indication of changes made instead of raw JSON
 * Hides partial JSON during streaming to prevent UI clutter
 */
export const AIMessageRenderer = memo(function AIMessageRenderer({ content, className, isStreaming = false }: AIMessageRendererProps) {
  if (!content) return null

  // Helper function to check if JSON is complete and valid
  const isCompleteValidJSON = (content: string): { isValid: boolean; jsonStr?: string; startIndex?: number; endIndex?: number } => {
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

    if (jsonMatch) {
      const jsonStr = jsonMatch[0].trim()
      try {
        JSON.parse(jsonStr) // Validate JSON
        return { 
          isValid: true, 
          jsonStr,
          startIndex: content.indexOf(jsonStr),
          endIndex: content.indexOf(jsonStr) + jsonStr.length
        }
      } catch (error) {
        return { isValid: false }
      }
    }
    
    return { isValid: false }
  }

  // Helper function to filter out JSON content while keeping other text
  const filterOutJSON = (content: string): string => {
    // Try to find JSON anywhere in the content
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

    if (jsonMatch) {
      // Remove the JSON content and clean up extra whitespace
      const filteredContent = content.replace(jsonMatch[0], '').trim()
      return filteredContent
    }
    
    return content
  }

  // Check if content contains incomplete JSON (anywhere in content)
  const hasIncompleteJSON = () => {
    const trimmed = content.trim()
    
    // Check if we have any opening brace but no complete JSON
    const jsonCheck = isCompleteValidJSON(content)
    const hasIncomplete = !jsonCheck.isValid && content.includes('{')
    
    // Debug logging
    console.log('JSON Loader Debug:', {
      content: content.substring(0, 100) + '...',
      trimmed: trimmed.substring(0, 50) + '...',
      hasOpeningBrace: content.includes('{'),
      jsonCheckValid: jsonCheck.isValid,
      hasIncomplete,
      shouldShowLoader: hasIncomplete
    })
    
    return hasIncomplete
  }

  // If we have incomplete JSON, show filtered text content with inline processing indicator
  if (hasIncompleteJSON()) {
    console.log('Showing inline JSON loader with filtered text content')
    const filteredContent = filterOutJSON(content)
    return (
      <div className={cn("space-y-2", className)}>
        {/* Show the filtered text content (without JSON) */}
        {filteredContent && (
          <div className="text-xs leading-relaxed">
            {filteredContent}
          </div>
        )}
        
        {/* Show inline processing indicator */}
        <JSONProcessingIndicator content={content} />
      </div>
    )
  }

  // Fallback: If content has { but we didn't catch it above, show filtered text with inline loader
  if (content.includes('{') && !isCompleteValidJSON(content).isValid) {
    console.log('Showing fallback inline JSON loader with filtered text content')
    const filteredContent = filterOutJSON(content)
    return (
      <div className={cn("space-y-2", className)}>
        {/* Show the filtered text content (without JSON) */}
        {filteredContent && (
          <div className="text-xs leading-relaxed">
            {filteredContent}
          </div>
        )}
        
        {/* Show inline processing indicator */}
        <JSONProcessingIndicator content={content} />
      </div>
    )
  }

  // Check for complete valid JSON
  const jsonCheck = isCompleteValidJSON(content)
  
  if (jsonCheck.isValid && jsonCheck.jsonStr && jsonCheck.startIndex !== undefined && jsonCheck.endIndex !== undefined) {
    const explanation = content.slice(0, jsonCheck.startIndex).trim()
    const confirmation = content.slice(jsonCheck.endIndex).trim()
    
    try {
      const parsed = JSON.parse(jsonCheck.jsonStr)
      
      // If JSON has meaningful content, show the formatted commands
      if (parsed.article || parsed.sections) {
        return (
          <div className={cn("space-y-2", className)}>
            {explanation && (
              <div className="text-xs leading-relaxed">
                {explanation}
              </div>
            )}
            
            {/* Show change indicators where commands box was */}
            <AIChangeIndicators 
              content={content} 
              isStreaming={isStreaming}
              className="ml-0 max-w-none"
            />
            
            {confirmation && (
              <div className="text-xs leading-relaxed">
                {confirmation}
              </div>
            )}
          </div>
        )
      }
      
      // If JSON is empty (like {}), hide it and only show explanation/confirmation
      if (Object.keys(parsed).length === 0) {
        return (
          <div className={cn("space-y-1", className)}>
            {explanation && (
              <div className="text-xs leading-relaxed">
                {explanation}
              </div>
            )}
            {confirmation && (
              <div className="text-xs leading-relaxed">
                {confirmation}
              </div>
            )}
          </div>
        )
      }
    } catch (error) {
      // If JSON parsing fails, fall back to regular content
      return (
        <div className={cn("space-y-1 text-xs leading-relaxed", className)}>
          {content}
        </div>
      )
    }
  }

  // Fallback - show regular content (no JSON detected)
  return (
    <div className={cn("space-y-1 text-xs leading-relaxed", className)}>
      {content}
    </div>
  )
})