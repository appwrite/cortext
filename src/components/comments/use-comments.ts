import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { db } from '@/lib/appwrite/db';
import { Query, type Models } from 'appwrite';
import type { Comments } from '@/lib/appwrite/appwrite.types';

interface CreateCommentData {
  content: string;
  articleId: string;
  blogId: string;
  targetType: string;
  targetId?: string;
  parentCommentId?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
}

interface UpdateCommentData {
  id: string;
  content?: string;
  isResolved?: boolean;
  resolvedBy?: string;
}

export function useComments(
  articleId: string,
  blogId: string,
  targetType: string,
  targetId?: string
) {
  const queryClient = useQueryClient();

  const {
    data: comments,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['comments', articleId, blogId, targetType, targetId],
    queryFn: async () => {
      const queries = [
        Query.equal('articleId', articleId),
        Query.equal('blogId', blogId),
        Query.equal('targetType', targetType),
        Query.orderDesc('$createdAt')
      ];

      if (targetId) {
        queries.push(Query.equal('targetId', targetId));
      }

      const response = await db.comments.list(queries);
      return response.documents as Comments[];
    },
    enabled: !!articleId && !!blogId && !!targetType,
  });

  const createComment = useMutation({
    mutationFn: async (data: CreateCommentData & { teamId?: string }) => {
      return await db.comments.create({
        content: data.content,
        articleId: data.articleId,
        blogId: data.blogId,
        targetType: data.targetType,
        targetId: data.targetId || null,
        parentCommentId: data.parentCommentId || null,
        authorId: data.authorId,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        isResolved: false,
        resolvedBy: null,
        resolvedAt: null,
        metadata: null,
      }, data.teamId);
    },
    onSuccess: () => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({
        queryKey: ['comments', articleId, blogId, targetType, targetId]
      });
    },
  });

  const updateComment = useMutation({
    mutationFn: async (data: UpdateCommentData) => {
      const updateData: Partial<Omit<Comments, keyof Models.Document>> = {};
      
      if (data.content !== undefined) {
        updateData.content = data.content;
      }
      if (data.isResolved !== undefined) {
        updateData.isResolved = data.isResolved;
        if (data.isResolved) {
          updateData.resolvedAt = new Date().toISOString();
        } else {
          updateData.resolvedAt = null;
        }
      }
      if (data.resolvedBy !== undefined) {
        updateData.resolvedBy = data.resolvedBy;
      }

      return await db.comments.update(data.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', articleId, blogId, targetType, targetId]
      });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      return await db.comments.delete(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', articleId, blogId, targetType, targetId]
      });
    },
  });

  return {
    comments,
    isLoading,
    error,
    refetch,
    createComment,
    updateComment,
    deleteComment,
  };
}

// Hook to load all comments for an article upfront
export function useAllComments(articleId: string, blogId: string) {
  const queryClient = useQueryClient();

  const { data: allComments, isLoading, error, refetch } = useQuery({
    queryKey: ['all-comments', articleId, blogId],
    queryFn: async () => {
      const queries = [
        Query.equal('articleId', articleId),
        Query.equal('blogId', blogId),
        Query.orderAsc('$createdAt')
      ];

      const response = await db.comments.list(queries);
      return response.documents as Comments[];
    },
    enabled: !!articleId && !!blogId,
  });

  // Memoize functions to prevent them from changing on every render
  const getCommentsForTarget = useMemo(() => {
    return (targetType: string, targetId?: string) => {
      if (!allComments) return [];
      
      return allComments.filter(comment => {
        const matchesType = comment.targetType === targetType;
        const matchesId = targetId ? comment.targetId === targetId : !comment.targetId;
        return matchesType && matchesId;
      });
    };
  }, [allComments]);

  const getCommentCountForTarget = useMemo(() => {
    return (targetType: string, targetId?: string) => {
      const comments = getCommentsForTarget(targetType, targetId);
      return comments.length;
    };
  }, [getCommentsForTarget]);

  const hasNewCommentsForTarget = useMemo(() => {
    return (targetType: string, targetId?: string) => {
      if (!allComments) return false;
      
      const comments = getCommentsForTarget(targetType, targetId);
      
      // Consider comments as "new" if created within the last 24 hours
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return comments.some(comment => {
        const commentDate = new Date(comment.$createdAt);
        return commentDate > dayAgo;
      });
    };
  }, [allComments, getCommentsForTarget]);

  return {
    allComments,
    isLoading,
    error,
    refetch,
    getCommentsForTarget,
    getCommentCountForTarget,
    hasNewCommentsForTarget,
  };
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCommentData & { teamId?: string }) => {
      return await db.comments.create({
        content: data.content,
        articleId: data.articleId,
        blogId: data.blogId,
        targetType: data.targetType,
        targetId: data.targetId || null,
        parentCommentId: data.parentCommentId || null,
        authorId: data.authorId,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        isResolved: false,
        resolvedBy: null,
        resolvedAt: null,
        metadata: null,
      }, data.teamId);
    },
    onSuccess: (newComment, variables) => {
      // Invalidate all-comments query to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['all-comments', variables.articleId, variables.blogId]
      });
      
      // Invalidate comment counts
      queryClient.invalidateQueries({
        queryKey: ['comment-counts', variables.articleId, variables.blogId]
      });
    },
  });
}
