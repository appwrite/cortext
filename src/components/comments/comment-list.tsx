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
  showResolveButton?: boolean;
}

export interface CommentListRef {
  focusComment: (commentId: string) => void;
}

export const CommentList = forwardRef<CommentListRef, CommentListProps>(({ 
  articleId, 
  blogId, 
  targetType, 
  targetId,
  onCommentAdded,
  showResolveButton = true
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

  // Focus on a comment when it's added - optimized to reduce interference
  const focusComment = (commentId: string) => {
    // Use a more efficient approach with fewer retries
    const tryFocus = (attempts = 0) => {
      const element = commentRefs.current[commentId];
      if (element) {
        // Only scroll if element is not already visible
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        
        if (!isVisible) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Focus for accessibility but don't interfere with typing
        if (document.activeElement !== element) {
          element.focus();
        }
      } else if (attempts < 3) { // Reduced retries
        setTimeout(() => tryFocus(attempts + 1), 300); // Increased delay
      }
    };
    
    // Use a longer delay to avoid interfering with form submission
    setTimeout(() => tryFocus(), 300);
  };

  // Handle comment added callback
  const handleCommentAdded = (commentId?: string) => {
    if (commentId) {
      onCommentAdded?.(commentId);
    }
    refetch();
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
              showResolveButton={showResolveButton}
            />
          </div>
        ))}
    </div>
  );
});

CommentList.displayName = 'CommentList';
