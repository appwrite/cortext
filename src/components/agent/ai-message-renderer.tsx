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

  // Helper function to fix JSON with literal control characters
  const fixJSONControlCharacters = (jsonStr: string): string => {
    let fixed = jsonStr
    let inString = false
    let escapeNext = false
    let result = ''
    
    for (let i = 0; i < fixed.length; i++) {
      const char = fixed[i]
      
      if (escapeNext) {
        result += char
        escapeNext = false
        continue
      }
      
      if (char === '\\') {
        result += char
        escapeNext = true
        continue
      }
      
      if (char === '"') {
        inString = !inString
        result += char
        continue
      }
      
      if (inString) {
        // Inside a string, escape control characters
        if (char === '\n') {
          result += '\\n'
        } else if (char === '\r') {
          result += '\\r'
        } else if (char === '\t') {
          result += '\\t'
        } else if (char === '\b') {
          result += '\\b'
        } else if (char === '\f') {
          result += '\\f'
        } else if (char.charCodeAt(0) < 32) {
          // Other control characters
          result += `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
        } else {
          result += char
        }
      } else {
        result += char
      }
    }
    
    return result
  }

  // Helper function to fix nested JSON strings
  const fixNestedJSONStrings = (jsonStr: string): string => {
    // More robust approach: find and fix data fields with nested JSON
    let result = jsonStr
    let searchIndex = 0
    
    while (true) {
      // Look for "data": " pattern
      const dataStart = result.indexOf('"data": "', searchIndex)
      if (dataStart === -1) break
      
      // Find the start of the nested JSON object
      const jsonStart = result.indexOf('{', dataStart)
      if (jsonStart === -1) break
      
      // Find the matching closing brace for the nested JSON
      let braceCount = 0
      let jsonEnd = jsonStart
      
      for (let i = jsonStart; i < result.length; i++) {
        if (result[i] === '{') braceCount++
        if (result[i] === '}') braceCount--
        if (braceCount === 0) {
          jsonEnd = i
          break
        }
      }
      
      if (braceCount === 0) {
        // Extract the nested JSON content
        const nestedJson = result.substring(jsonStart, jsonEnd + 1)
        // Escape quotes in the nested JSON
        const escapedJson = nestedJson.replace(/"/g, '\\"')
        // Replace the original with escaped version
        result = result.substring(0, jsonStart) + escapedJson + result.substring(jsonEnd + 1)
        searchIndex = jsonStart + escapedJson.length
      } else {
        searchIndex = jsonStart + 1
      }
    }
    
    return result
  }

  // Helper function to check if JSON is complete and valid
  const isCompleteValidJSON = (content: string): { isValid: boolean; jsonStr?: string; startIndex?: number; endIndex?: number } => {
    // Find the first opening brace and use proper brace counting to find the complete JSON
    const firstBraceIndex = content.indexOf('{')
    if (firstBraceIndex === -1) {
      return { isValid: false }
    }

    let braceCount = 0
    let endIndex = firstBraceIndex
    
    for (let i = firstBraceIndex; i < content.length; i++) {
      if (content[i] === '{') braceCount++
      if (content[i] === '}') braceCount--
      if (braceCount === 0) {
        endIndex = i
        break
      }
    }
    
    if (braceCount === 0) {
      let jsonStr = content.substring(firstBraceIndex, endIndex + 1).trim()
      
      // Try to parse the JSON as-is first
      try {
        JSON.parse(jsonStr)
        return { 
          isValid: true, 
          jsonStr,
          startIndex: firstBraceIndex,
          endIndex: endIndex + 1
        }
      } catch (error) {
        // If parsing fails due to control characters, try to fix them
        try {
          jsonStr = fixNestedJSONStrings(jsonStr)
          jsonStr = fixJSONControlCharacters(jsonStr)
          JSON.parse(jsonStr)
          return { 
            isValid: true, 
            jsonStr,
            startIndex: firstBraceIndex,
            endIndex: endIndex + 1
          }
        } catch (secondError) {
          return { isValid: false }
        }
      }
    }
    
    return { isValid: false }
  }

  // Helper function to filter out JSON content while keeping other text
  const filterOutJSON = (content: string): string => {
    // Find the first opening brace and use proper brace counting to find the complete JSON
    const firstBraceIndex = content.indexOf('{')
    if (firstBraceIndex === -1) {
      return content // No JSON found, return original content
    }

    let braceCount = 0
    let endIndex = firstBraceIndex
    
    for (let i = firstBraceIndex; i < content.length; i++) {
      if (content[i] === '{') braceCount++
      if (content[i] === '}') braceCount--
      if (braceCount === 0) {
        endIndex = i
        break
      }
    }
    
    if (braceCount === 0) {
      // Remove the JSON part and return the rest
      const beforeJson = content.substring(0, firstBraceIndex).trim()
      const afterJson = content.substring(endIndex + 1).trim()
      return [beforeJson, afterJson].filter(Boolean).join('\n\n')
    }
    
    return content // If JSON is incomplete, return original content
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

  // If we have incomplete JSON, show filtered text content alongside JSON processing indicator
  if (hasIncompleteJSON()) {
    console.log('Showing JSON loader during streaming')
    const filteredContent = filterOutJSON(content)
    
    // During streaming, show filtered text content alongside JSON processing indicator
    if (isStreaming) {
      return (
        <div className={cn("space-y-2", className)}>
          {/* Show the filtered text content (without JSON) */}
          {filteredContent && (
            <div className="text-xs leading-relaxed">
              {filteredContent}
            </div>
          )}
          
          {/* Show JSON processing indicator */}
          <JSONProcessingIndicator content={content} />
        </div>
      )
    }
    
    // If not streaming but still incomplete, show the same layout
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
    
    // During streaming, show filtered text content alongside JSON processing indicator
    if (isStreaming) {
      return (
        <div className={cn("space-y-2", className)}>
          {/* Show the filtered text content (without JSON) */}
          {filteredContent && (
            <div className="text-xs leading-relaxed">
              {filteredContent}
            </div>
          )}
          
          {/* Show JSON processing indicator */}
          <JSONProcessingIndicator content={content} />
        </div>
      )
    }
    
    // If not streaming but still incomplete, show the same layout
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