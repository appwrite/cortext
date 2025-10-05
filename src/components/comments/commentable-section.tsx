import React, { useState } from 'react';
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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handlePopoverOpen = () => {
    setIsPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
  };

  return (
    <div className={cn("flex items-start group", className)}>
      <div className="flex-1">
        {children}
      </div>
      
      {/* Comment icon positioned in the sidelines outside form border */}
        <div className={cn(
          "-mr-[54px] ml-4 flex items-center justify-end transition-opacity duration-200",
          commentCount > 0 ? "opacity-100" : (isPopoverOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100")
        )}>
        <CommentPopover
          articleId={articleId}
          blogId={blogId}
          targetType="section"
          targetId={sectionId}
          commentCount={commentCount}
          hasNewComments={hasNewComments}
          side="left"
          onOpen={handlePopoverOpen}
          onClose={handlePopoverClose}
        />
      </div>
    </div>
  );
}
