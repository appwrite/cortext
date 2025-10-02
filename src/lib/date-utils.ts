/**
 * Date formatting utilities for consistent, localized date display
 */

/**
 * Format a date for display in a way that's unambiguous across different locales
 * Uses the user's browser locale but with a format that's clear to all users
 */
export function formatDateForDisplay(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }

  // Use Intl.DateTimeFormat with options that provide clear, unambiguous formatting
  // This will respect the user's locale while being clear about the format
  const formatter = new Intl.DateTimeFormat(navigator.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Use 24-hour format to avoid AM/PM confusion
    timeZoneName: 'short' // Include timezone for clarity
  })

  return formatter.format(dateObj)
}

/**
 * Format a date for display in a compact format (without time)
 * Useful for table displays where space is limited
 */
export function formatDateCompact(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }

  const formatter = new Intl.DateTimeFormat(navigator.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  return formatter.format(dateObj)
}

/**
 * Format a date for relative display (e.g., "2 hours ago", "3 days ago")
 * Falls back to absolute format if the date is too old
 */
export function formatDateRelative(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  // If more than 7 days old, show absolute date
  if (diffInSeconds > 7 * 24 * 60 * 60) {
    return formatDateCompact(dateObj)
  }

  // Use Intl.RelativeTimeFormat for relative dates
  const rtf = new Intl.RelativeTimeFormat(navigator.language, { numeric: 'auto' })
  
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second')
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
  }
}
