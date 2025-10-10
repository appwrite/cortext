import React, { createContext, useContext, useCallback, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import { Query } from 'appwrite'
import type { Articles, Revisions } from '@/lib/appwrite/appwrite.types'

interface ArticleContextType {
  // Data
  article: Articles | null
  revisions: Revisions[]
  latestRevision: Revisions | null
  formData: Articles | null
  
  // Loading states
  isLoading: boolean
  isLoadingArticle: boolean
  isLoadingRevisions: boolean
  
  // Computed values
  hasUnpublishedChanges: boolean
  
  // Actions
  updateArticle: (data: Partial<Omit<Articles, keyof any>>) => Promise<void>
  refreshArticle: () => Promise<void>
  refreshRevisions: () => Promise<void>
}

const ArticleContext = createContext<ArticleContextType | null>(null)

interface ArticleProviderProps {
  articleId: string
  children: React.ReactNode
}

export function ArticleProvider({ articleId, children }: ArticleProviderProps) {
  const queryClient = useQueryClient()
  const [article, setArticle] = useState<Articles | null>(null)
  const [revisions, setRevisions] = useState<Revisions[]>([])
  const [latestRevision, setLatestRevision] = useState<Revisions | null>(null)
  const [formData, setFormData] = useState<Articles | null>(null)
  
  // Track if we're currently fetching to prevent duplicate calls
  const isFetchingRef = useRef(false)

  // Single query for article data
  const { data: articleData, isLoading: isLoadingArticle, error: articleError } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => db.articles.get(articleId),
    enabled: !!articleId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })

  // Single query for revisions data
  const { data: revisionsData, isLoading: isLoadingRevisions, error: revisionsError } = useQuery({
    queryKey: ['revisions', articleId],
    queryFn: () => 
      db.revisions.list([
        Query.equal('articleId', articleId),
        Query.orderDesc('version'),
        Query.limit(100)
      ]),
    enabled: !!articleId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })

  // Debug article context state
  React.useEffect(() => {
  }, [articleId, articleData, isLoadingArticle, articleError, revisionsData, isLoadingRevisions, revisionsError])

  // Update state when data changes
  React.useEffect(() => {
    if (articleData) {
      setArticle(articleData)
    }
  }, [articleData])

  React.useEffect(() => {
    if (revisionsData) {
      setRevisions(revisionsData.documents)
      setLatestRevision(revisionsData.documents[0] || null)
    }
  }, [revisionsData])

  // Compute form data from article and latest revision
  React.useEffect(() => {
    if (!article) {
      setFormData(null)
      return
    }
    
    if (!latestRevision) {
      setFormData(article)
      return
    }
    
    const revisionData = latestRevision.data ? JSON.parse(latestRevision.data) : {}
    const revisionAttributes = revisionData.attributes || revisionData
    
    // Merge article data with revision data
    const mergedData: Articles = {
      ...article,
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
      body: revisionAttributes.sections ? JSON.stringify(revisionAttributes.sections) : article.body,
      activeRevisionId: latestRevision.$id,
      $updatedAt: latestRevision.$updatedAt,
    }
    
    setFormData(mergedData)
  }, [article, latestRevision])

  // Compute hasUnpublishedChanges
  const hasUnpublishedChanges = React.useMemo(() => {
    if (!article || !latestRevision) return false
    
    if (article.activeRevisionId === latestRevision.$id) {
      return false
    }
    
    const revisionTime = new Date(latestRevision.$updatedAt)
    const articleTime = new Date(article.$updatedAt)
    
    return revisionTime > articleTime
  }, [article, latestRevision])

  // Actions
  const updateArticle = useCallback(async (data: Partial<Omit<Articles, keyof any>>) => {
    if (!article) return
    
    // Optimistically update local state
    const updatedArticle = { ...article, ...data }
    setArticle(updatedArticle)
    
    // Update cache
    queryClient.setQueryData(['article', articleId], updatedArticle)
  }, [article, articleId, queryClient])

  const refreshArticle = useCallback(async () => {
    if (isFetchingRef.current) return
    
    isFetchingRef.current = true
    try {
      const data = await db.articles.get(articleId)
      setArticle(data)
      queryClient.setQueryData(['article', articleId], data)
    } finally {
      isFetchingRef.current = false
    }
  }, [articleId, queryClient])

  const refreshRevisions = useCallback(async () => {
    if (isFetchingRef.current) return
    
    isFetchingRef.current = true
    try {
      const data = await db.revisions.list([
        Query.equal('articleId', articleId),
        Query.orderDesc('version'),
        Query.limit(100)
      ])
      setRevisions(data.documents)
      setLatestRevision(data.documents[0] || null)
      queryClient.setQueryData(['revisions', articleId], data)
    } finally {
      isFetchingRef.current = false
    }
  }, [articleId, queryClient])

  const value: ArticleContextType = {
    article,
    revisions,
    latestRevision,
    formData,
    isLoading: isLoadingArticle || isLoadingRevisions,
    isLoadingArticle,
    isLoadingRevisions,
    hasUnpublishedChanges,
    updateArticle,
    refreshArticle,
    refreshRevisions,
  }

  return (
    <ArticleContext.Provider value={value}>
      {children}
    </ArticleContext.Provider>
  )
}

export function useArticle() {
  const context = useContext(ArticleContext)
  if (!context) {
    throw new Error('useArticle must be used within an ArticleProvider')
  }
  return context
}
