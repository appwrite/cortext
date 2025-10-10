import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommentItem } from './comment-item';
import { CommentForm } from './comment-form';
import { useAllComments } from './use-comments';
import { cn } from '@/lib/utils';

interface CommentsSidebarProps {
  articleId: string;
  blogId: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function CommentsSidebar({
  articleId,
  blogId,
  isOpen,
  onToggle,
  className
}: CommentsSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Get all comments
  const { allComments, isLoading } = useAllComments(articleId, blogId);

  // Handle Escape key and focus loss
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggle();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  // Group comments by target
  const groupedComments = React.useMemo(() => {
    if (!allComments) return {};
    
    const groups: { [key: string]: any[] } = {};
    
    allComments.forEach(comment => {
      const groupKey = `${comment.targetType}-${comment.targetId || 'none'}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(comment);
    });
    
    return groups;
  }, [allComments]);

  // Get target label for display
  const getTargetLabel = (targetType: string, targetId?: string) => {
    switch (targetType) {
      case 'title':
        return 'Title';
      case 'section':
        switch (targetId) {
          case 'intro':
            return 'Introduction';
          case 'body':
            return 'Body';
          case 'conclusion':
            return 'Conclusion';
          default:
            return `Section: ${targetId}`;
        }
      case 'general':
        return 'General Comments';
      default:
        return `${targetType}: ${targetId || 'General'}`;
    }
  };

  // Handle clicking on a comment reference
  const handleCommentReferenceClick = (targetType: string, targetId?: string) => {
    // This would scroll to the specific element in the editor
    // For now, we'll just log it - you can implement the actual scrolling logic
    console.log(`Navigate to ${targetType}:${targetId || 'none'}`);
  };

  // Handle accordion toggle
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const totalComments = allComments?.length || 0;

  return (
    <>
      {/* Sidebar */}
      {isOpen && (
        <div ref={sidebarRef} className="fixed top-0 right-0 h-full w-96 bg-background border-l shadow-lg z-40 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-lg">Comments</h2>
              {totalComments > 0 && (
                <span className="px-2 py-1 text-xs bg-muted rounded-full">
                  {totalComments}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Comments List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading comments...
              </div>
            ) : Object.keys(groupedComments).length > 0 ? (
              <div className="p-4 space-y-6">
                {Object.entries(groupedComments).map(([groupKey, comments]) => {
                  const firstComment = comments[0];
                  const targetType = firstComment.targetType;
                  const targetId = firstComment.targetId;
                  
                  return (
                    <div key={groupKey} className="space-y-3">
                      {/* Group Header */}
                      <div className="flex items-center justify-between">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleGroup(groupKey)}
                          className="w-full justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <ChevronDown 
                              className={cn(
                                "h-3 w-3 transition-transform duration-200",
                                expandedGroups.has(groupKey) ? "rotate-0" : "-rotate-90"
                              )}
                            />
                            <span>{getTargetLabel(targetType, targetId)}</span>
                          </div>
                          <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                            {comments.length}
                          </span>
                        </Button>
                      </div>
                      
                      {/* Comments in this group */}
                      {expandedGroups.has(groupKey) && (
                        <div className="space-y-3 ml-4">
                          {comments.map((comment) => (
                            <CommentItem
                              key={comment.$id}
                              comment={comment}
                              onReply={() => {}}
                              onResolve={() => {}}
                              articleId={articleId}
                              blogId={blogId}
                              targetType={comment.targetType}
                              targetId={comment.targetId}
                              showResolveButton={false}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No comments yet
              </div>
            )}
          </ScrollArea>

          {/* Comment Form */}
          <div className="p-4 border-t">
            <CommentForm
              articleId={articleId}
              blogId={blogId}
              targetType="general"
              targetId="sidebar"
              onCommentAdded={() => {
                // Focus behavior is handled by CommentList
              }}
              placeholder="Add a general comment..."
            />
          </div>
        </div>
      )}
    </>
  );
}
