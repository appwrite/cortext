import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Code, Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react'

interface JSONProcessingIndicatorProps {
  content: string
  className?: string
}

interface ProcessingState {
  stage: 'detecting' | 'parsing' | 'validating' | 'completed' | 'error'
  progress: number
  message: string
  details?: string
}

/**
 * Shows animated feedback for JSON processing during streaming
 * Provides visual indication of what's happening with the JSON content
 */
export function JSONProcessingIndicator({ content, className }: JSONProcessingIndicatorProps) {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    stage: 'detecting',
    progress: 0,
    message: 'Detecting JSON structure...'
  })

  const [pulseAnimation, setPulseAnimation] = useState(false)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when content updates (unless user is scrolling)
  useEffect(() => {
    if (scrollContainerRef.current && !isUserScrolling) {
      const container = scrollContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [content, isUserScrolling])

  // Handle scroll events to detect user scrolling
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 5
    
    if (isAtBottom) {
      setIsUserScrolling(false)
    } else {
      setIsUserScrolling(true)
    }
  }, [])

  // Memoize the content analysis to prevent unnecessary recalculations
  const contentAnalysis = useMemo(() => {
    if (!content.trim().startsWith('{')) {
      return null
    }

    const hasOpeningBrace = content.includes('{')
    const hasClosingBrace = content.includes('}')
    const hasNewline = content.includes('\n')
    const contentLength = content.length
    const jsonChars = content.match(/[{}":,\[\]]/g)?.length || 0

    return {
      hasOpeningBrace,
      hasClosingBrace,
      hasNewline,
      contentLength,
      jsonChars
    }
  }, [content])

  // Generate simple processing messages
  const getProcessingMessage = (stage: string) => {
    const messages = {
      detecting: "Parsing content",
      parsing: "Parsing content",
      validating: "Parsing content",
      completed: "Complete",
      error: "Error"
    }

    return messages[stage as keyof typeof messages] || "Parsing content"
  }

  // Debounced state update to prevent excessive re-renders
  const updateProcessingState = useCallback((newState: ProcessingState) => {
    setProcessingState(prevState => {
      // Only update if the state actually changed
      if (
        prevState.stage !== newState.stage ||
        prevState.progress !== newState.progress ||
        prevState.message !== newState.message ||
        prevState.details !== newState.details
      ) {
        return newState
      }
      return prevState
    })
  }, [])

  useEffect(() => {
    if (!contentAnalysis) {
      return
    }

    const { hasOpeningBrace, hasClosingBrace, hasNewline, contentLength, jsonChars } = contentAnalysis

    // Trigger pulse animation on state changes (debounced)
    setPulseAnimation(true)
    const timer = setTimeout(() => setPulseAnimation(false), 300)

    // Debounced analysis to prevent excessive updates
    const analyzeContent = () => {
      if (!hasOpeningBrace) {
        updateProcessingState({
          stage: 'detecting',
          progress: 10,
          message: getProcessingMessage('detecting'),
          details: undefined
        })
        return
      }

      if (hasOpeningBrace && !hasClosingBrace) {
        const estimatedProgress = Math.min(40, (contentLength / 50) * 40)
        updateProcessingState({
          stage: 'parsing',
          progress: estimatedProgress,
          message: getProcessingMessage('parsing'),
          details: undefined
        })
        return
      }

      if (hasOpeningBrace && hasClosingBrace && !hasNewline) {
        updateProcessingState({
          stage: 'validating',
          progress: 80,
          message: getProcessingMessage('validating'),
          details: undefined
        })
        return
      }

      if (hasOpeningBrace && hasClosingBrace && hasNewline) {
        // Try to parse the JSON to see if it's complete
        try {
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
            const parsed = JSON.parse(jsonStr)
            const commandCount = Object.keys(parsed).length
            updateProcessingState({
              stage: 'completed',
              progress: 100,
              message: getProcessingMessage('completed'),
              details: undefined
            })
          } else {
            updateProcessingState({
              stage: 'parsing',
              progress: 60,
              message: getProcessingMessage('parsing'),
              details: undefined
            })
          }
        } catch (error) {
          updateProcessingState({
            stage: 'error',
            progress: 0,
            message: getProcessingMessage('error'),
            details: undefined
          })
        }
        return
      }

      // Default state for ongoing parsing
      const estimatedProgress = Math.min(70, (contentLength / 100) * 70)
      updateProcessingState({
        stage: 'parsing',
        progress: estimatedProgress,
        message: getProcessingMessage('parsing'),
        details: undefined
      })
    }

    // Use a small delay to debounce rapid content changes
    const debounceTimer = setTimeout(analyzeContent, 50)
    
    return () => {
      clearTimeout(timer)
      clearTimeout(debounceTimer)
    }
  }, [contentAnalysis, updateProcessingState])

  // Memoize the stage-based functions to prevent recreation on every render
  const stageConfig = useMemo(() => {
    const getStageIcon = () => {
      switch (processingState.stage) {
        case 'detecting':
          return <Code className="h-3 w-3" />
        case 'parsing':
        case 'validating':
          return <Loader2 className="h-3 w-3 animate-spin" />
        case 'completed':
          return <CheckCircle className="h-3 w-3" />
        case 'error':
          return <AlertCircle className="h-3 w-3" />
        default:
          return <Code className="h-3 w-3" />
      }
    }

    const getStageColor = () => {
      switch (processingState.stage) {
        case 'detecting':
          return 'text-blue-600 dark:text-blue-400'
        case 'parsing':
        case 'validating':
          return 'text-blue-600 dark:text-blue-400'
        case 'completed':
          return 'text-green-600 dark:text-green-400'
        case 'error':
          return 'text-red-600 dark:text-red-400'
        default:
          return 'text-blue-600 dark:text-blue-400'
      }
    }

    const getBackgroundColor = () => {
      switch (processingState.stage) {
        case 'detecting':
          return 'bg-blue-50 dark:bg-blue-950/20'
        case 'parsing':
        case 'validating':
          return 'bg-blue-50 dark:bg-blue-950/20'
        case 'completed':
          return 'bg-green-50 dark:bg-green-950/20'
        case 'error':
          return 'bg-red-50 dark:bg-red-950/20'
        default:
          return 'bg-blue-50 dark:bg-blue-950/20'
      }
    }

    return {
      icon: getStageIcon(),
      textColor: getStageColor(),
      backgroundColor: getBackgroundColor()
    }
  }, [processingState.stage])

  return (
    <div className={cn(
      "flex flex-col gap-3 px-3 py-2 rounded-lg text-xs transition-all duration-500 ease-out w-full",
      stageConfig.backgroundColor,
      pulseAnimation && "animate-pulse",
      className
    )}>
      <div className="flex items-start gap-2">
        <div className={cn("flex-shrink-0 mt-0.5", stageConfig.textColor)}>
          {stageConfig.icon}
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className={cn("font-medium", stageConfig.textColor)}>
            {processingState.message}
          </div>
          
          {processingState.details && (
            <div className="text-xs text-muted-foreground opacity-75">
              {processingState.details}
            </div>
          )}
          
          {/* Enhanced progress bar with glow effect */}
          <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div 
              className={cn(
                "h-1.5 rounded-full transition-all duration-700 ease-out relative",
                processingState.stage === 'completed' ? 'bg-green-500' :
                processingState.stage === 'error' ? 'bg-red-500' :
                'bg-blue-500'
              )}
              style={{ width: `${processingState.progress}%` }}
            >
              {/* Glow effect for active processing */}
              {(processingState.stage === 'parsing' || processingState.stage === 'validating') && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              )}
            </div>
          </div>
        </div>
        
        {/* Success sparkle effect */}
        {processingState.stage === 'completed' && (
          <div className="flex-shrink-0">
            <Zap className="h-3 w-3 text-green-500 animate-pulse" />
          </div>
        )}
      </div>
      
      {/* Content Preview Card */}
      {content.includes('{') && (
        <div className="ml-5 bg-black/90 dark:bg-gray-900 rounded-md border border-gray-700 overflow-hidden">
          <div 
            ref={scrollContainerRef}
            className="h-24 overflow-y-auto p-2"
            onScroll={handleScroll}
          >
            <div className="text-xs text-gray-300 leading-relaxed">
              {formatContentForPreview(content)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Format JSON content for human-friendly preview
 * Extracts key information and presents it in a readable way
 */
function formatContentForPreview(content: string): string {
  try {
    // Find the JSON part
    const jsonStart = content.indexOf('{')
    if (jsonStart === -1) return 'Processing content...'
    
    const jsonContent = content.substring(jsonStart)
    
    // Try to extract information even from incomplete JSON
    const previewLines: string[] = []
    
    // Extract title if present
    const titleMatch = jsonContent.match(/"title":\s*"([^"]+)"/)
    if (titleMatch) {
      previewLines.push(`Title: ${titleMatch[1]}`)
    }
    
    // Extract subtitle if present
    const subtitleMatch = jsonContent.match(/"subtitle":\s*"([^"]+)"/)
    if (subtitleMatch) {
      const subtitle = subtitleMatch[1]
      previewLines.push(`Subtitle: ${subtitle.substring(0, 80)}${subtitle.length > 80 ? '...' : ''}`)
    }
    
    // Extract trailer if present
    const trailerMatch = jsonContent.match(/"trailer":\s*"([^"]+)"/)
    if (trailerMatch) {
      previewLines.push(`Trailer: ${trailerMatch[1]}`)
    }
    
    // Count sections and show details
    const sectionMatches = jsonContent.match(/"type":\s*"([^"]+)"/g)
    if (sectionMatches) {
      previewLines.push(`Sections: ${sectionMatches.length} items`)
      
      // Extract section details
      const sections = jsonContent.match(/"type":\s*"([^"]+)"/g) || []
      const actions = jsonContent.match(/"action":\s*"([^"]+)"/g) || []
      const contents = jsonContent.match(/"content":\s*"([^"]+)"/g) || []
      
      for (let i = 0; i < Math.min(sections.length, 5); i++) {
        const type = sections[i]?.match(/"type":\s*"([^"]+)"/)?.[1] || 'content'
        const action = actions[i]?.match(/"action":\s*"([^"]+)"/)?.[1] || 'create'
        const content = contents[i]?.match(/"content":\s*"([^"]+)"/)?.[1] || ''
        
        if (content) {
          const preview = content.substring(0, 60)
          previewLines.push(`  ${action} ${type}: ${preview}${content.length > 60 ? '...' : ''}`)
        } else {
          previewLines.push(`  ${action} ${type}`)
        }
      }
    }
    
    return previewLines.length > 0 ? previewLines.join('\n') : 'Preparing content...'
  } catch (error) {
    return 'Processing content...'
  }
}

/**
 * Hook to determine if content is currently being processed as JSON
 */
export function useJSONProcessingState(content: string) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState<string>('')

  useEffect(() => {
    if (!content.trim().startsWith('{')) {
      setIsProcessing(false)
      setProcessingStage('')
      return
    }

    const hasOpeningBrace = content.includes('{')
    const hasClosingBrace = content.includes('}')
    const hasNewline = content.includes('\n')

    if (!hasOpeningBrace) {
      setIsProcessing(true)
      setProcessingStage('detecting')
    } else if (hasOpeningBrace && !hasClosingBrace) {
      setIsProcessing(true)
      setProcessingStage('parsing')
    } else if (hasOpeningBrace && hasClosingBrace && !hasNewline) {
      setIsProcessing(true)
      setProcessingStage('validating')
    } else if (hasOpeningBrace && hasClosingBrace && hasNewline) {
      // Check if JSON is complete
      try {
        const jsonMatch = content.match(/^\{[\s\S]*?\}\n/)
        if (jsonMatch) {
          JSON.parse(jsonMatch[0].trim())
          setIsProcessing(false)
          setProcessingStage('completed')
        } else {
          setIsProcessing(true)
          setProcessingStage('parsing')
        }
      } catch (error) {
        setIsProcessing(false)
        setProcessingStage('error')
      }
    } else {
      setIsProcessing(true)
      setProcessingStage('parsing')
    }
  }, [content])

  return { isProcessing, processingStage }
}
