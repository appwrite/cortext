/**
 * Utility functions for RTL (Right-to-Left) language support
 */

// List of RTL language codes
const RTL_LANGUAGES = [
  'ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ku', 'dv', 'yi', 'ji', 'iw', 'ji', 'iw'
]

/**
 * Detects if a given text contains RTL characters
 * @param text - The text to analyze
 * @returns true if the text contains RTL characters, false otherwise
 */
export function isRTLText(text: string): boolean {
  if (!text || text.trim().length === 0) return false
  
  // Check for RTL Unicode ranges
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/
  return rtlRegex.test(text)
}

/**
 * Detects if a given language code is RTL
 * @param languageCode - The language code to check (e.g., 'ar', 'he', 'en')
 * @returns true if the language is RTL, false otherwise
 */
export function isRTLLanguage(languageCode: string): boolean {
  if (!languageCode) return false
  return RTL_LANGUAGES.includes(languageCode.toLowerCase())
}

/**
 * Gets the text direction based on content analysis
 * @param text - The text to analyze
 * @param fallbackLanguage - Optional language code to use as fallback
 * @returns 'rtl' or 'ltr'
 */
export function getTextDirection(text: string, fallbackLanguage?: string): 'rtl' | 'ltr' {
  // If we have text, analyze it
  if (text && text.trim().length > 0) {
    return isRTLText(text) ? 'rtl' : 'ltr'
  }
  
  // If no text but we have a language code, use that
  if (fallbackLanguage) {
    return isRTLLanguage(fallbackLanguage) ? 'rtl' : 'ltr'
  }
  
  // Default to LTR
  return 'ltr'
}

/**
 * Gets the appropriate dir attribute value for HTML elements
 * @param text - The text to analyze
 * @param fallbackLanguage - Optional language code to use as fallback
 * @returns 'rtl' or 'ltr' for use in dir attribute
 */
export function getDirAttribute(text: string, fallbackLanguage?: string): 'rtl' | 'ltr' {
  return getTextDirection(text, fallbackLanguage)
}
