import React, { useState, memo, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CommentPopover } from './comment-popover';

interface OptimizedCommentableInputProps {
  children: React.ReactNode;
  articleId: string;
  blogId: string;
  targetType: string;
  targetId?: string;
  commentCount: number;
  hasNewComments?: boolean;
  className?: string;
}

// Separate comment icon component that's completely independent of input state
const CommentIconContainer = memo(({ 
  articleId, 
  blogId, 
  targetType, 
  targetId, 
  commentCount, 
  hasNewComments, 
  isPopoverOpen, 
  onPopoverOpen, 
  onPopoverClose 
}: {
  articleId: string;
  blogId: string;
  targetType: string;
  targetId?: string;
  commentCount: number;
  hasNewComments: boolean;
  isPopoverOpen: boolean;
  onPopoverOpen: () => void;
  onPopoverClose: () => void;
}) => {
  return (
    <div className={cn(
      "absolute -right-[54px] top-0 h-full flex items-center justify-end transition-opacity duration-200 pointer-events-none",
      commentCount > 0 ? "opacity-100" : (isPopoverOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100")
    )}>
      <div className="pointer-events-auto">
        <CommentPopover
          articleId={articleId}
          blogId={blogId}
          targetType={targetType}
          targetId={targetId}
          commentCount={commentCount}
          hasNewComments={hasNewComments}
          side="left"
          onOpen={onPopoverOpen}
          onClose={onPopoverClose}
        />
      </div>
    </div>
  );
});

CommentIconContainer.displayName = 'CommentIconContainer';

// Main optimized component
export const OptimizedCommentableInput = memo(function OptimizedCommentableInput({
  children,
  articleId,
  blogId,
  targetType,
  targetId,
  commentCount,
  hasNewComments = false,
  className
}: OptimizedCommentableInputProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize handlers to prevent re-renders
  const handlePopoverOpen = useCallback(() => {
    setIsPopoverOpen(true);
  }, []);

  const handlePopoverClose = useCallback(() => {
    setIsPopoverOpen(false);
  }, []);

  // Use a stable key for the comment icon to prevent unnecessary re-renders
  const commentIconKey = `${articleId}-${blogId}-${targetType}-${targetId || 'main'}`;

  return (
    <div ref={containerRef} className={cn("relative group", className)}>
      {/* Input content - this can change without affecting comments */}
      <div className="w-full">
        {children}
      </div>
      
      {/* Comment icon positioned absolutely - completely independent of input state */}
      <CommentIconContainer
        key={commentIconKey}
        articleId={articleId}
        blogId={blogId}
        targetType={targetType}
        targetId={targetId}
        commentCount={commentCount}
        hasNewComments={hasNewComments}
        isPopoverOpen={isPopoverOpen}
        onPopoverOpen={handlePopoverOpen}
        onPopoverClose={handlePopoverClose}
      />
    </div>
  );
});

// Alternative approach: Separate comment overlay component
export const CommentOverlay = memo(function CommentOverlay({
  articleId,
  blogId,
  targetType,
  targetId,
  commentCount,
  hasNewComments = false,
  className
}: {
  articleId: string;
  blogId: string;
  targetType: string;
  targetId?: string;
  commentCount: number;
  hasNewComments?: boolean;
  className?: string;
}) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handlePopoverOpen = useCallback(() => {
    setIsPopoverOpen(true);
  }, []);

  const handlePopoverClose = useCallback(() => {
    setIsPopoverOpen(false);
  }, []);

  return (
    <div className={cn(
      "absolute -right-[54px] top-0 h-full flex items-center justify-end transition-opacity duration-200",
      commentCount > 0 ? "opacity-100" : (isPopoverOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
      className
    )}>
      <CommentPopover
        articleId={articleId}
        blogId={blogId}
        targetType={targetType}
        targetId={targetId}
        commentCount={commentCount}
        hasNewComments={hasNewComments}
        side="left"
        onOpen={handlePopoverOpen}
        onClose={handlePopoverClose}
      />
    </div>
  );
});
