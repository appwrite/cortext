import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { db } from '@/lib/appwrite/db'
import { Query } from 'appwrite'
import type { Articles, Revisions } from '@/lib/appwrite/appwrite.types'

export function useLatestRevision(articleId: string) {
  const { data: article, isLoading: isLoadingArticle } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => db.articles.get(articleId),
    enabled: !!articleId,
  })

  // Get all revisions and derive the latest one to avoid duplicate queries
  const { data: revisionsData, isLoading: isLoadingRevisions } = useQuery({
    queryKey: ['revisions', articleId],
    queryFn: () => 
      db.revisions.list([
        Query.equal('articleId', articleId),
        Query.orderDesc('version'),
        Query.limit(100)
      ]),
    enabled: !!articleId,
  })

  // Derive the latest revision from the revisions data
  const latestRevision = useMemo(() => {
    return revisionsData?.documents?.[0] || null
  }, [revisionsData])

  const isLoading = isLoadingArticle || isLoadingRevisions

  // Compare revision timestamp with article update time and check if article is using current revision
  const hasUnpublishedChanges = useMemo(() => {
    if (!article || !latestRevision) return false
    
    // First check if the article is using the current revision ID
    if (article.activeRevisionId === latestRevision.$id) {
      return false // Article is already using the latest revision
    }
    
    // Check if the latest revision is newer than the article's last update
    // This indicates there are unpublished changes that need to be published
    const revisionTime = new Date(latestRevision.$updatedAt)
    const articleTime = new Date(article.$updatedAt)
    
    return revisionTime > articleTime
  }, [article, latestRevision])

  // Get the data to use for the form (latest revision if available, otherwise article)
        const formData = useMemo(() => {
          if (!article) return null
          
          if (!latestRevision) return article
          
          const revisionData = latestRevision.data ? JSON.parse(latestRevision.data) : {}
          
          // Handle both old nested format and new flat format
          const revisionAttributes = revisionData.attributes || revisionData
          
          // Always use the latest revision data as the primary source
          // Only fall back to article data if revision doesn't have the field
          const result = {
            ...article,
            // Use revision data as primary source
            title: revisionAttributes.title ?? article.title,
            subtitle: revisionAttributes.subtitle ?? article.subtitle,
            trailer: revisionAttributes.trailer ?? article.trailer,
            status: revisionAttributes.status ?? article.status,
            live: revisionAttributes.live ?? article.live,
            pinned: revisionAttributes.pinned ?? article.pinned,
            redirect: revisionAttributes.redirect ?? article.redirect,
            slug: revisionAttributes.slug ?? article.slug,
            authors: revisionAttributes.authors ?? article.authors,
            categories: revisionAttributes.categories ?? article.categories,
            images: revisionAttributes.images ?? article.images,
            blogId: revisionAttributes.blogId ?? article.blogId,
            // Use revision sections as primary source
            body: revisionAttributes.sections ? JSON.stringify(revisionAttributes.sections) : article.body,
            // Update the activeRevisionId to reflect the latest revision
            activeRevisionId: latestRevision.$id,
            // Use revision timestamps for change detection
            $updatedAt: latestRevision.$updatedAt,
          }
          
          return result
        }, [article, latestRevision])

  return {
    article,
    latestRevision,
    formData,
    hasUnpublishedChanges,
    isLoading,
  }
}
