/**
 * Auto-save status indicator component
 * Shows the current state of auto-save functionality
 */

import React from 'react'
import { CheckCircle, Clock, Wifi, AlertCircle, Loader2 } from 'lucide-react'
import { AutoSaveState } from '../../hooks/use-auto-save'

interface AutoSaveIndicatorProps {
  state: AutoSaveState
  className?: string
  showTooltip?: boolean
  compact?: boolean
}

export function AutoSaveIndicator({ 
  state, 
  className = '', 
  showTooltip = true,
  compact = false 
}: AutoSaveIndicatorProps) {
  const getStatusInfo = () => {
    switch (state.status) {
      case 'saving':
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: 'Saving...',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        }
      case 'saved':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          text: 'Saved',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20'
        }
      case 'error':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Error',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20'
        }
      case 'idle':
      default:
        if (state.hasUnsavedChanges) {
          return {
            icon: <Clock className="w-3 h-3" />,
            text: 'Unsaved changes',
            color: 'text-yellow-600 dark:text-yellow-400',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
          }
        }
        return {
          icon: <Wifi className="w-3 h-3" />,
          text: 'Online',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const lastSavedText = state.lastSaved 
    ? `Last saved ${formatLastSaved(state.lastSaved)}`
    : ''

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className={statusInfo.color}>
          {statusInfo.icon}
        </span>
        {showTooltip && (
          <div className="group relative">
            <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {statusInfo.text}
              {lastSavedText && <><br />{lastSavedText}</>}
              {state.error && <><br />Error: {state.error}</>}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${statusInfo.bgColor}`}>
        <span className={statusInfo.color}>
          {statusInfo.icon}
        </span>
        <span className={`text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
      </div>
      
      {state.lastSaved && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {lastSavedText}
        </span>
      )}
      
      {state.error && (
        <span className="text-xs text-red-500 dark:text-red-400">
          {state.error}
        </span>
      )}
    </div>
  )
}

function formatLastSaved(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) {
    return 'just now'
  } else if (minutes < 60) {
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else {
    return `${days}d ago`
  }
}

export default AutoSaveIndicator
