/**
 * Local storage backup utilities for preventing data loss
 * during page reloads or accidental tab closures
 */

interface BackupData {
  articleId: string
  formData: any
  timestamp: number
  version: number
}

const BACKUP_KEY_PREFIX = 'cortext-backup-'
const BACKUP_VERSION = 1

/**
 * Generate a backup key for an article
 */
function getBackupKey(articleId: string): string {
  return `${BACKUP_KEY_PREFIX}${articleId}`
}

/**
 * Save form data to local storage as backup
 */
export function saveBackup(articleId: string, formData: any): void {
  try {
    const backupData: BackupData = {
      articleId,
      formData: {
        ...formData,
        // Ensure we have a clean copy without any React refs or functions
        body: typeof formData.body === 'string' ? formData.body : JSON.stringify(formData.body)
      },
      timestamp: Date.now(),
      version: BACKUP_VERSION
    }

    const key = getBackupKey(articleId)
    localStorage.setItem(key, JSON.stringify(backupData))
    
    console.log('💾 Backup saved:', {
      articleId,
      hasBody: !!backupData.formData.body,
      bodyType: typeof backupData.formData.body,
      bodyLength: backupData.formData.body?.length || 0,
      bodyPreview: backupData.formData.body?.substring(0, 100) + '...'
    })
    
  } catch (error) {
    console.warn('Failed to save backup to local storage:', error)
  }
}

/**
 * Retrieve backup data from local storage
 */
export function getBackup(articleId: string): BackupData | null {
  try {
    const key = getBackupKey(articleId)
    const backupStr = localStorage.getItem(key)
    
    if (!backupStr) {
      return null
    }

    const backupData: BackupData = JSON.parse(backupStr)
    
    // Validate backup data
    if (!backupData.articleId || !backupData.formData || !backupData.timestamp) {
      console.warn('Invalid backup data found, removing')
      removeBackup(articleId)
      return null
    }

    // Check if backup is too old (older than 24 hours)
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    if (Date.now() - backupData.timestamp > maxAge) {
      console.log('Backup data is too old, removing')
      removeBackup(articleId)
      return null
    }

    return backupData
  } catch (error) {
    console.warn('Failed to retrieve backup from local storage:', error)
    return null
  }
}

/**
 * Remove backup data from local storage
 */
export function removeBackup(articleId: string): void {
  try {
    const key = getBackupKey(articleId)
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to remove backup from local storage:', error)
  }
}

/**
 * Check if backup exists for an article
 */
export function hasBackup(articleId: string): boolean {
  return getBackup(articleId) !== null
}

/**
 * Get all backup keys (for cleanup purposes)
 */
export function getAllBackupKeys(): string[] {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(BACKUP_KEY_PREFIX)) {
        keys.push(key)
      }
    }
    return keys
  } catch (error) {
    console.warn('Failed to get backup keys:', error)
    return []
  }
}

/**
 * Clean up old backups (older than 24 hours)
 */
export function cleanupOldBackups(): void {
  try {
    const keys = getAllBackupKeys()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    const now = Date.now()

    keys.forEach(key => {
      try {
        const backupStr = localStorage.getItem(key)
        if (backupStr) {
          const backupData: BackupData = JSON.parse(backupStr)
          if (now - backupData.timestamp > maxAge) {
            localStorage.removeItem(key)
          }
        }
      } catch (error) {
        // If we can't parse the backup, remove it
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.warn('Failed to cleanup old backups:', error)
  }
}

/**
 * Get backup age in minutes
 */
export function getBackupAge(articleId: string): number | null {
  const backup = getBackup(articleId)
  if (!backup) return null
  
  return Math.floor((Date.now() - backup.timestamp) / (1000 * 60))
}

/**
 * Get debug information about backups
 */
export function getBackupDebugInfo(articleId: string) {
  const backup = getBackup(articleId)
  const allKeys = getAllBackupKeys()
  
  return {
    hasBackup: backup !== null,
    backupAge: backup ? getBackupAge(articleId) : null,
    backupTimestamp: backup?.timestamp ? new Date(backup.timestamp).toISOString() : null,
    backupSize: backup ? JSON.stringify(backup).length : 0,
    totalBackups: allKeys.length,
    allBackupKeys: allKeys,
    localStorageAvailable: typeof Storage !== 'undefined' && !!window.localStorage,
    localStorageQuota: (() => {
      try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          return 'Available (quota check not implemented)'
        }
        return 'Unknown'
      } catch {
        return 'Unknown'
      }
    })()
  }
}

/**
 * Force cleanup of all backups (for debug purposes)
 */
export function forceCleanupAllBackups(): number {
  try {
    const keys = getAllBackupKeys()
    keys.forEach(key => localStorage.removeItem(key))
    return keys.length
  } catch (error) {
    console.error('Failed to cleanup all backups:', error)
    return 0
  }
}

/**
 * Get detailed backup information for a specific article
 */
export function getDetailedBackupInfo(articleId: string) {
  const backup = getBackup(articleId)
  if (!backup) return null
  
  return {
    articleId: backup.articleId,
    timestamp: backup.timestamp,
    age: getBackupAge(articleId),
    version: backup.version,
    formDataKeys: Object.keys(backup.formData),
    bodyType: typeof backup.formData.body,
    bodyLength: typeof backup.formData.body === 'string' 
      ? backup.formData.body.length 
      : JSON.stringify(backup.formData.body).length,
    totalSize: JSON.stringify(backup).length
  }
}
