/**
 * Offline storage utility for auto-save functionality
 * Provides localStorage-based persistence with error handling and cleanup
 */

export interface OfflineChange {
  id: string
  articleId: string
  timestamp: number
  data: any
  isHumanChange: boolean
  version: number
}

export interface OfflineStorageConfig {
  maxAge?: number // Maximum age in milliseconds (default: 7 days)
  maxItems?: number // Maximum number of items per article (default: 50)
  cleanupInterval?: number // Cleanup interval in milliseconds (default: 1 hour)
}

const DEFAULT_CONFIG: Required<OfflineStorageConfig> = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxItems: 50,
  cleanupInterval: 60 * 60 * 1000, // 1 hour
}

class OfflineStorage {
  private config: Required<OfflineStorageConfig>
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(config: OfflineStorageConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startCleanupTimer()
  }

  /**
   * Store a change offline
   */
  storeChange(change: Omit<OfflineChange, 'id' | 'timestamp'>): string {
    const id = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()
    
    const fullChange: OfflineChange = {
      ...change,
      id,
      timestamp,
    }

    console.log('💾 OfflineStorage.storeChange:', {
      id,
      articleId: change.articleId,
      isHumanChange: change.isHumanChange,
      hasData: !!change.data,
      timestamp: new Date(timestamp).toISOString()
    })

    try {
      const key = this.getStorageKey(change.articleId)
      const existing = this.getChanges(change.articleId)
      
      console.log('📦 Existing changes count:', existing.length)
      
      // Add new change
      const updated = [...existing, fullChange]
      
      // Sort by timestamp and limit items
      const sorted = updated
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.config.maxItems)
      
      console.log('📦 Storing changes:', {
        totalChanges: sorted.length,
        maxItems: this.config.maxItems,
        key
      })
      
      localStorage.setItem(key, JSON.stringify(sorted))
      
      console.log('✅ Offline change stored successfully:', id)
      return id
    } catch (error) {
      console.error('❌ Failed to store change offline:', error)
      throw error
    }
  }

  /**
   * Get all changes for an article
   */
  getChanges(articleId: string): OfflineChange[] {
    try {
      const key = this.getStorageKey(articleId)
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get changes from offline storage:', error)
      return []
    }
  }

  /**
   * Get the latest change for an article
   */
  getLatestChange(articleId: string): OfflineChange | null {
    const changes = this.getChanges(articleId)
    return changes.length > 0 ? changes[0] : null
  }

  /**
   * Get only human changes (excludes AI/LLM changes)
   */
  getHumanChanges(articleId: string): OfflineChange[] {
    return this.getChanges(articleId).filter(change => change.isHumanChange)
  }

  /**
   * Get the latest human change
   */
  getLatestHumanChange(articleId: string): OfflineChange | null {
    const humanChanges = this.getHumanChanges(articleId)
    return humanChanges.length > 0 ? humanChanges[0] : null
  }

  /**
   * Remove a specific change
   */
  removeChange(articleId: string, changeId: string): boolean {
    try {
      const changes = this.getChanges(articleId)
      const filtered = changes.filter(change => change.id !== changeId)
      
      if (filtered.length === changes.length) {
        return false // Change not found
      }
      
      const key = this.getStorageKey(articleId)
      localStorage.setItem(key, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Failed to remove change from offline storage:', error)
      return false
    }
  }

  /**
   * Clear all changes for an article
   */
  clearChanges(articleId: string): boolean {
    try {
      const key = this.getStorageKey(articleId)
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Failed to clear changes from offline storage:', error)
      return false
    }
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges(articleId: string): boolean {
    return this.getChanges(articleId).length > 0
  }

  /**
   * Check if there are unsaved human changes
   */
  hasUnsavedHumanChanges(articleId: string): boolean {
    return this.getHumanChanges(articleId).length > 0
  }

  /**
   * Get storage key for an article
   */
  private getStorageKey(articleId: string): string {
    return `cortext_offline_${articleId}`
  }

  /**
   * Start cleanup timer to remove old changes
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Clean up old changes
   */
  private cleanup(): void {
    try {
      const now = Date.now()
      const cutoff = now - this.config.maxAge
      
      // Get all localStorage keys that match our pattern
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('cortext_offline_')
      )
      
      keys.forEach(key => {
        try {
          const data = localStorage.getItem(key)
          if (!data) return
          
          const changes: OfflineChange[] = JSON.parse(data)
          const filtered = changes.filter(change => change.timestamp > cutoff)
          
          if (filtered.length !== changes.length) {
            localStorage.setItem(key, JSON.stringify(filtered))
          }
        } catch (error) {
          console.error(`Failed to cleanup changes for key ${key}:`, error)
        }
      })
    } catch (error) {
      console.error('Failed to cleanup offline storage:', error)
    }
  }

  /**
   * Destroy the storage instance and cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage()

// Export class for testing
export { OfflineStorage }
