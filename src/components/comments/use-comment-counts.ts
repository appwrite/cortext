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

  // Calculate counts from pre-loaded comments
  const commentCounts: CommentCounts = {};
  
  if (allComments) {
    for (const target of targets) {
      const targetKey = `${target.type}-${target.id || 'main'}`;
      commentCounts[targetKey] = {
        count: getCommentCountForTarget(target.type, target.id),
        hasNewComments: hasNewCommentsForTarget(target.type, target.id)
      };
    }
  }

  const getCommentCount = (type: string, id?: string) => {
    const targetKey = `${type}-${id || 'main'}`;
    const result = commentCounts[targetKey] || { count: 0, hasNewComments: false };
    return result;
  };

  return {
    commentCounts,
    getCommentCount,
    isLoading
  };
}
