import { useState, useEffect, useRef } from 'react'

/**
 * Hook to track elapsed time for streaming messages
 * Returns the elapsed time in milliseconds and updates every 100ms
 */
export function useStreamingTimer(startTime: number | null, isStreaming: boolean) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isStreaming && startTime) {
      // Start the timer
      const updateTimer = () => {
        const now = Date.now()
        setElapsedMs(now - startTime)
      }

      // Update immediately
      updateTimer()

      // Then update every 100ms
      intervalRef.current = setInterval(updateTimer, 100)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } else {
      // Stop the timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      // If we have a start time but not streaming, calculate final elapsed time
      if (startTime && !isStreaming) {
        const now = Date.now()
        setElapsedMs(now - startTime)
      }
    }
  }, [isStreaming, startTime])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return elapsedMs
}

/**
 * Hook to track streaming start time for a message
 * Uses the message's creation date as the start time
 */
export function useStreamingStartTime(messageId: string, createdAt: string, isStreaming: boolean) {
  const [startTime, setStartTime] = useState<number | null>(null)
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)

  useEffect(() => {
    if (messageId !== lastMessageId) {
      // New message, use creation date as start time
      setLastMessageId(messageId)
      const creationTime = new Date(createdAt).getTime()
      setStartTime(creationTime)
    }
  }, [messageId, createdAt, lastMessageId])

  return startTime
}
