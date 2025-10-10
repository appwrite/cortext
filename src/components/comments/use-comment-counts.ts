import { useMemo, useRef } from 'react';
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

  // Use ref to store previous comment counts to prevent unnecessary recalculations
  const prevCommentCountsRef = useRef<CommentCounts>({});
  const prevAllCommentsRef = useRef(allComments);

  // Memoize comment counts to prevent expensive recalculations on every render
  // Only recalculate when allComments actually changes
  const commentCounts = useMemo(() => {
    const counts: CommentCounts = {};
    
    if (allComments) {
      // Only recalculate if allComments has actually changed
      if (prevAllCommentsRef.current !== allComments) {
        for (const target of targets) {
          const targetKey = `${target.type}-${target.id || 'main'}`;
          counts[targetKey] = {
            count: getCommentCountForTarget(target.type, target.id),
            hasNewComments: hasNewCommentsForTarget(target.type, target.id)
          };
        }
        prevAllCommentsRef.current = allComments;
        prevCommentCountsRef.current = counts;
      } else {
        // Return previous counts if allComments hasn't changed
        return prevCommentCountsRef.current;
      }
    }
    
    return counts;
  }, [allComments, targets, getCommentCountForTarget, hasNewCommentsForTarget]);

  // Memoize the getCommentCount function to prevent it from changing on every render
  // This function should be stable and only change when comment counts actually change
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
