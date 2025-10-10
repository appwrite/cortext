import { useMemo } from 'react';
import { useAllComments } from './use-comments';

interface CommentCounts {
  [key: string]: {
    count: number;
    hasNewComments: boolean;
  };
}

export function useCommentCounts(
  articleId: string,
  blogId: string,
  targets: Array<{ type: string; id?: string }>
) {
  const { 
    allComments, 
    isLoading, 
    getCommentCountForTarget, 
    hasNewCommentsForTarget 
  } = useAllComments(articleId, blogId);

  // Memoize comment counts to prevent expensive recalculations on every render
  const commentCounts = useMemo(() => {
    const counts: CommentCounts = {};
    
    if (allComments) {
      for (const target of targets) {
        const targetKey = `${target.type}-${target.id || 'main'}`;
        counts[targetKey] = {
          count: getCommentCountForTarget(target.type, target.id),
          hasNewComments: hasNewCommentsForTarget(target.type, target.id)
        };
      }
    }
    
    return counts;
  }, [allComments, targets, getCommentCountForTarget, hasNewCommentsForTarget]);

  // Memoize the getCommentCount function to prevent it from changing on every render
  const getCommentCount = useMemo(() => {
    return (type: string, id?: string) => {
      const targetKey = `${type}-${id || 'main'}`;
      const result = commentCounts[targetKey] || { count: 0, hasNewComments: false };
      return result;
    };
  }, [commentCounts]);

  return {
    commentCounts,
    getCommentCount,
    isLoading
  };
}
