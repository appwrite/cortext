import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { useAllComments } from './use-comments';
import { CommentItem } from './comment-item';
import { Loader2 } from 'lucide-react';

interface CommentListProps {
  articleId: string;
  blogId: string;
  targetType: string;
  targetId?: string;
  onCommentAdded?: (commentId: string) => void;
}

export interface CommentListRef {
  focusComment: (commentId: string) => void;
}

export const CommentList = forwardRef<CommentListRef, CommentListProps>(({ 
  articleId, 
  blogId, 
  targetType, 
  targetId,
  onCommentAdded
}, ref) => {
  const { 
    allComments,
    isLoading, 
    error, 
    refetch,
    getCommentsForTarget
  } = useAllComments(articleId, blogId);

  // Get comments for this specific target
  const comments = getCommentsForTarget(targetType, targetId);

  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Expose focusComment function to parent components
  useImperativeHandle(ref, () => ({
    focusComment
  }));

  // Focus on a comment when it's added
  const focusComment = (commentId: string) => {
    // Try multiple times with increasing delays to handle async updates
    const tryFocus = (attempts = 0) => {
      const element = commentRefs.current[commentId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (attempts < 5) {
        // Retry after a short delay if element not found
        setTimeout(() => tryFocus(attempts + 1), 200 * (attempts + 1));
      }
    };
    
    // Start trying to focus after a short delay
    setTimeout(() => tryFocus(), 100);
  };

  // Handle comment added callback
  const handleCommentAdded = (commentId?: string) => {
    if (commentId) {
      onCommentAdded?.(commentId);
      // Focus on the newly added comment
      focusComment(commentId);
    }
    refetch();
    
    // Also scroll to bottom as fallback
    setTimeout(() => {
      if (commentsContainerRef.current) {
        commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
      }
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Failed to load comments
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No comments yet
      </div>
    );
  }

  // Only show top-level comments (no nested replies)
  const topLevelComments = comments.filter(comment => !comment.parentCommentId);

  return (
    <div ref={commentsContainerRef} className="space-y-4 p-4">
        {topLevelComments.map((comment) => (
          <div 
            key={comment.$id}
            ref={(el) => { commentRefs.current[comment.$id] = el; }}
            className="transition-all duration-200"
          >
            <CommentItem 
              comment={comment} 
              onReply={() => refetch()}
              onResolve={() => refetch()}
              articleId={articleId}
              blogId={blogId}
              targetType={targetType}
              targetId={targetId}
            />
          </div>
        ))}
    </div>
  );
});

CommentList.displayName = 'CommentList';
