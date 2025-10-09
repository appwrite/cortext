import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
          message: 'Detecting JSON structure...',
          details: 'Looking for opening brace'
        })
        return
      }

      if (hasOpeningBrace && !hasClosingBrace) {
        const estimatedProgress = Math.min(40, (contentLength / 50) * 40)
        updateProcessingState({
          stage: 'parsing',
          progress: estimatedProgress,
          message: 'Parsing JSON content...',
          details: `${jsonChars} JSON characters processed`
        })
        return
      }

      if (hasOpeningBrace && hasClosingBrace && !hasNewline) {
        updateProcessingState({
          stage: 'validating',
          progress: 80,
          message: 'Validating JSON structure...',
          details: 'Checking syntax and completeness'
        })
        return
      }

      if (hasOpeningBrace && hasClosingBrace && hasNewline) {
        // Try to parse the JSON to see if it's complete
        try {
          const jsonMatch = content.match(/^\{[\s\S]*?\}\n/)
          if (jsonMatch) {
            const jsonStr = jsonMatch[0].trim()
            const parsed = JSON.parse(jsonStr)
            const commandCount = Object.keys(parsed).length
            updateProcessingState({
              stage: 'completed',
              progress: 100,
              message: 'JSON processing complete',
              details: `${commandCount} command${commandCount !== 1 ? 's' : ''} ready`
            })
          } else {
            updateProcessingState({
              stage: 'parsing',
              progress: 60,
              message: 'Building JSON structure...',
              details: 'Waiting for complete JSON'
            })
          }
        } catch (error) {
          updateProcessingState({
            stage: 'error',
            progress: 0,
            message: 'Invalid JSON format',
            details: 'Syntax error detected'
          })
        }
        return
      }

      // Default state for ongoing parsing
      const estimatedProgress = Math.min(70, (contentLength / 100) * 70)
      updateProcessingState({
        stage: 'parsing',
        progress: estimatedProgress,
        message: 'Processing JSON data...',
        details: `${contentLength} characters received`
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
      "inline-flex items-start gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-500 ease-out",
      stageConfig.backgroundColor,
      pulseAnimation && "animate-pulse",
      className
    )}>
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
  )
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
