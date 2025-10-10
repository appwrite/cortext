import { useArticle } from '@/contexts/article-context'

export function useLatestRevision(articleId: string) {
  const {
    article,
    latestRevision,
    formData,
    hasUnpublishedChanges,
    isLoading,
  } = useArticle()

  return {
    article,
    latestRevision,
    formData,
    hasUnpublishedChanges,
    isLoading,
  }
}
