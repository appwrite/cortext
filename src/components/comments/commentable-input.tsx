import React from 'react';
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

export function CommentableInput({
  children,
  articleId,
  blogId,
  targetType,
  targetId,
  commentCount,
  hasNewComments = false,
  className
}: CommentableInputProps) {
  return (
    <div className={cn("flex items-center group", className)}>
      <div className="flex-1">
        {children}
      </div>
      
      {/* Comment icon positioned in the sidelines outside form border */}
        <div className={cn(
          "-mr-[64px] ml-6 flex items-center justify-end transition-opacity duration-200",
          commentCount > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
        <CommentPopover
          articleId={articleId}
          blogId={blogId}
          targetType={targetType}
          targetId={targetId}
          commentCount={commentCount}
          hasNewComments={hasNewComments}
          side="left"
        />
      </div>
    </div>
  );
}
