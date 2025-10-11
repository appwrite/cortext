import { useStreamingTimer, useStreamingStartTime } from '@/hooks/use-streaming-timer'
import { formatDuration } from '@/lib/date-utils'

interface StreamingTimerProps {
  messageId: string
  createdAt: string
  isStreaming: boolean
  generationTimeMs?: number | null
  tokenCount?: number | null
  status?: 'generating' | 'completed' | 'error'
}

/**
 * Component that displays timing information for messages
 * Shows real-time elapsed time during streaming, and final stats when completed
 */
export function StreamingTimer({ 
  messageId, 
  createdAt,
  isStreaming, 
  generationTimeMs, 
  tokenCount, 
  status 
}: StreamingTimerProps) {
  const startTime = useStreamingStartTime(messageId, createdAt, isStreaming)
  const elapsedMs = useStreamingTimer(startTime, isStreaming)

  if (isStreaming && elapsedMs > 0) {
    // Show timer during streaming (below the "Thinking/Writing" indicator)
    return (
      <div className="text-xs text-muted-foreground mt-1">
        {formatDuration(elapsedMs)}
      </div>
    )
  }

  if (status === 'completed') {
    // Show final stats when completed (replaces the completion indicator)
    const finalTime = generationTimeMs || elapsedMs
    return (
      <div className="text-xs text-muted-foreground mt-1">
        {finalTime ? formatDuration(finalTime) : '✓ Generated'}
        {tokenCount ? ` • ${tokenCount} tokens` : ''}
      </div>
    )
  }

  return null
}
