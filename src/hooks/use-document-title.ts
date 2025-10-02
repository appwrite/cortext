import { useEffect } from 'react'

/**
 * Hook to dynamically set the document title
 * @param title - The title to set. If not provided, defaults to "Cortext"
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const baseTitle = 'Cortext'
    const fullTitle = title ? `${baseTitle} - ${title}` : baseTitle
    document.title = fullTitle
  }, [title])
}
