import React, { useState, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CommentPopover } from './comment-popover';

interface CommentableInputProps {
  children: React.ReactNode;
  articleId: string;
  blogId: string;
  targetType: string;
  targetId?: string;
  commentCount: number;
  hasNewComments?: boolean;
  className?: string;
}

// Memoize the comment icon component to prevent re-renders
const CommentIconWrapper = memo(({ 
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
      "-mr-[54px] ml-[14px] flex items-center justify-end transition-opacity duration-200",
      commentCount > 0 ? "opacity-100" : (isPopoverOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100")
    )}>
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
  );
});

CommentIconWrapper.displayName = 'CommentIconWrapper';

export const CommentableInput = memo(function CommentableInput({
  children,
  articleId,
  blogId,
  targetType,
  targetId,
  commentCount,
  hasNewComments = false,
  className
}: CommentableInputProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Memoize handlers to prevent re-renders
  const handlePopoverOpen = useCallback(() => {
    setIsPopoverOpen(true);
  }, []);

  const handlePopoverClose = useCallback(() => {
    setIsPopoverOpen(false);
  }, []);

  return (
    <div className={cn("flex group", className)}>
      <div className="flex-1">
        {children}
      </div>
      
      {/* Comment icon positioned in the sidelines outside form border */}
      <CommentIconWrapper
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
