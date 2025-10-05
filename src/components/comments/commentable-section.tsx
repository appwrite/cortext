import React from 'react';
import { cn } from '@/lib/utils';
import { CommentPopover } from './comment-popover';

interface CommentableSectionProps {
  children: React.ReactNode;
  articleId: string;
  blogId: string;
  sectionId: string;
  commentCount: number;
  hasNewComments?: boolean;
  className?: string;
}

export function CommentableSection({
  children,
  articleId,
  blogId,
  sectionId,
  commentCount,
  hasNewComments = false,
  className
}: CommentableSectionProps) {
  return (
    <div className={cn("flex items-start group", className)}>
      <div className="flex-1">
        {children}
      </div>
      
      {/* Comment icon positioned in the sidelines outside form border */}
        <div className="-mr-[64px] ml-6 flex items-center justify-end opacity-100 group-hover:opacity-100 transition-opacity">
        <CommentPopover
          articleId={articleId}
          blogId={blogId}
          targetType="section"
          targetId={sectionId}
          commentCount={commentCount}
          hasNewComments={hasNewComments}
          side="left"
        />
      </div>
    </div>
  );
}
