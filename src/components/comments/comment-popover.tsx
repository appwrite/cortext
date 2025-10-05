import React, { useState, useRef, useEffect } from 'react';
import { CommentIcon } from './comment-icon';
import { CommentList } from './comment-list';
import { CommentForm } from './comment-form';
import { cn } from '@/lib/utils';

interface CommentPopoverProps {
  articleId: string;
  blogId: string;
  targetType: string;
  targetId?: string;
  commentCount: number;
  hasNewComments?: boolean;
  className?: string;
  side?: 'left' | 'right';
}

export function CommentPopover({
  articleId,
  blogId,
  targetType,
  targetId,
  commentCount,
  hasNewComments = false,
  className,
  side = 'right'
}: CommentPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const commentListRef = useRef<{ focusComment: (commentId: string) => void } | null>(null);

  // Calculate popover position and height
  const calculatePosition = () => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const stickyFooterHeight = 80; // Height of sticky footer
      const headerHeight = 60; // Height of top header
      const padding = 20; // Some padding for safety
      const popoverHeight = 400; // Estimated popover height
      
      const availableSpaceBelow = viewportHeight - containerRect.bottom - stickyFooterHeight - padding;
      const availableSpaceAbove = containerRect.top - headerHeight - padding;
      
      // Determine if we should open above or below
      if (availableSpaceBelow < popoverHeight && availableSpaceAbove > availableSpaceBelow) {
        setPopoverPosition('top');
      } else {
        setPopoverPosition('bottom');
      }
    }
  };

  const getMaxPopoverHeight = () => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const stickyFooterHeight = 80; // Height of sticky footer
      const headerHeight = 60; // Height of top header
      const padding = 20; // Some padding for safety
      
      const availableSpaceBelow = viewportHeight - containerRect.bottom - stickyFooterHeight - padding;
      const availableSpaceAbove = containerRect.top - headerHeight - padding;
      
      // Use the appropriate space based on position
      const availableSpace = popoverPosition === 'top' ? availableSpaceAbove : availableSpaceBelow;
      const maxHeight = Math.max(250, Math.min(500, availableSpace));
      
      return maxHeight;
    }
    return 400; // Fallback height
  };

  // Calculate position when opening and close dropdown when clicking outside
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <div className={cn("flex items-center", className)}>
        <CommentIcon
          commentCount={commentCount}
          hasNewComments={hasNewComments}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      
      {isOpen && (
        <>
          {/* Arrow pointing to the comment icon - matching notification style */}
          <div className={cn(
            "absolute w-0 h-0 border-l-[6px] border-r-[6px] z-[60]",
            popoverPosition === 'bottom' 
              ? "top-full border-b-[6px] border-l-transparent border-r-transparent border-b-border"
              : "bottom-full border-t-[6px] border-l-transparent border-r-transparent border-t-border",
            side === 'left' ? 'right-3' : 'right-3'
          )} />
          <div 
            ref={popoverRef}
            className={cn(
              "absolute w-96 bg-background border rounded-lg shadow-lg z-[60] animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden flex flex-col",
              popoverPosition === 'bottom' 
                ? "top-full mt-1" 
                : "bottom-full mb-1",
              side === 'left' ? 'right-0' : 'left-0'
            )}
            style={{
              maxHeight: `${getMaxPopoverHeight()}px`
            }}
          >
            {/* Fixed header */}
            <div className="p-3 border-b flex-shrink-0">
              <h3 className="font-semibold text-sm">Comments ({commentCount})</h3>
            </div>
            
            {/* Scrollable comments list */}
            <div 
              className="flex-1 overflow-y-auto min-h-0"
            >
              <CommentList
                ref={commentListRef}
                articleId={articleId}
                blogId={blogId}
                targetType={targetType}
                targetId={targetId}
                onCommentAdded={(commentId) => {
                  // Focus will be handled by CommentList
                }}
              />
            </div>
            
            {/* Fixed footer with comment form */}
            <div className="p-3 border-t flex-shrink-0">
              <CommentForm
                articleId={articleId}
                blogId={blogId}
                targetType={targetType}
                targetId={targetId}
                onCommentAdded={(commentId) => {
                  // Focus on the newly added comment
                  if (commentId && commentListRef.current) {
                    commentListRef.current.focusComment(commentId);
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
