import React, { useState, useRef, forwardRef, useImperativeHandle, useCallback, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useCreateComment } from './use-comments';
import { useTeamBlogContext } from '@/contexts/team-blog-context';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  articleId: string;
  blogId: string;
  targetType: string;
  targetId?: string;
  parentCommentId?: string;
  onCommentAdded: (commentId?: string) => void;
  placeholder?: string;
  className?: string;
}

export interface CommentFormRef {
  focus: () => void;
}

export const CommentForm = forwardRef<CommentFormRef, CommentFormProps>(({
  articleId,
  blogId,
  targetType,
  targetId,
  parentCommentId,
  onCommentAdded,
  placeholder = "Add a comment...",
  className
}, ref) => {
  const { user } = useAuth();
  const { currentTeam } = useTeamBlogContext();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createComment = useCreateComment();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Function to adjust textarea height
  const adjustHeight = useCallback(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
  }, []);

  // Adjust height when content changes - optimized to reduce re-renders
  useEffect(() => {
    if (!content) return; // Skip if content is empty
    
    const frameId = requestAnimationFrame(adjustHeight);
    return () => cancelAnimationFrame(frameId);
  }, [content, adjustHeight]);

  // Expose focus function to parent components
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    }
  }));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!content.trim() || !user || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const newComment = await createComment.mutateAsync({
        content: content.trim(),
        articleId,
        blogId,
        targetType,
        targetId,
        parentCommentId,
        authorId: user.$id,
        authorName: user.name || user.email || 'Anonymous',
        authorEmail: user.email || '',
        teamId: currentTeam?.$id,
      });
      
      setContent('');
      onCommentAdded(newComment.$id);
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter (or Cmd+Enter on Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Detect if user is on Mac to show correct shortcut text
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutText = isMac ? 'Cmd+Return' : 'Ctrl+Enter';

  // Cmd/Ctrl icon component
  const KeyIcon = () => (
    <div className="inline-flex items-center justify-center w-3 h-3 text-[8px] font-medium bg-muted rounded border">
      {isMac ? '⌘' : 'Ctrl'}
    </div>
  );

  if (!user) {
    return (
      <div className="text-sm text-muted-foreground text-center py-2">
        Please sign in to comment
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
        style={{ overflow: 'hidden' }}
        disabled={isSubmitting}
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-0.5 text-[10px] text-muted-foreground">
          {typeof navigator !== 'undefined' && navigator.maxTouchPoints === 0 && (
            <>
              <KeyIcon />
              <span>+ {isMac ? 'Return' : 'Enter'} to submit</span>
            </>
          )}
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || isSubmitting}
          className="h-8"
          title={`${parentCommentId ? 'Reply' : 'Comment'} (${shortcutText})`}
        >
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <Send className="h-3 w-3 mr-1" />
              {parentCommentId ? 'Reply' : 'Comment'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
});

CommentForm.displayName = 'CommentForm';
