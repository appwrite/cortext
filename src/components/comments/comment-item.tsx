import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, Trash2, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { StandardAvatar } from '@/components/ui/standard-avatar';
import { useAuth } from '@/hooks/use-auth';
import { useComments } from './use-comments';
import { cn } from '@/lib/utils';
import type { Comments } from '@/lib/appwrite/appwrite.types';

interface CommentItemProps {
  comment: Comments;
  isReply?: boolean;
  onReply: () => void;
  onResolve: () => void;
  articleId: string;
  blogId: string;
  targetType: string;
  targetId?: string;
  showResolveButton?: boolean;
}

export function CommentItem({ 
  comment, 
  isReply = false, 
  onReply, 
  onResolve,
  articleId,
  blogId,
  targetType,
  targetId,
  showResolveButton = true
}: CommentItemProps) {
  const { user } = useAuth();
  const [isResolving, setIsResolving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { updateComment, deleteComment } = useComments(articleId, blogId, targetType, targetId);

  const isOwner = user?.$id === comment.authorId;
  const canResolve = user?.$id === comment.authorId || user?.$id === comment.resolvedBy;

  const handleResolve = async () => {
    if (isResolving) return;
    
    setIsResolving(true);
    try {
      await updateComment.mutateAsync({
        id: comment.$id,
        isResolved: !comment.isResolved,
        resolvedBy: user?.$id || undefined
      });
      onResolve();
    } finally {
      setIsResolving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteComment.mutateAsync(comment.$id);
      onResolve();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (isSaving || !editContent.trim()) return;
    
    setIsSaving(true);
    try {
      await updateComment.mutateAsync({
        id: comment.$id,
        content: editContent.trim()
      });
      setIsEditing(false);
      onResolve();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn(
      "group relative",
      isReply && "border-l-2 border-muted pl-3"
    )}>
      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-background rounded-lg z-50 flex items-center justify-center shadow-lg border border-border/50">
          <div className="text-center space-y-3 p-4 w-full">
            <div className="text-sm font-medium text-foreground">
              Delete this comment?
            </div>
            <div className="text-xs text-muted-foreground">
              This action cannot be undone.
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isDeleting ? (
                  <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Yes, Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="h-8 px-3"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-start space-x-3">
        <StandardAvatar 
          className="h-8 w-8"
          initials={getInitials(comment.authorName)}
        />
        
        <div className="flex-1 min-w-0">
          <div className="mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground [&_a]:no-underline [&_a]:text-foreground [&_a]:cursor-default">
                {comment.authorName}
              </span>
              {comment.isResolved && (
                <Badge variant="outline" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.$createdAt), { addSuffix: true })}
            </span>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isSaving}
              />
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editContent.trim()}
                  className="h-7 px-2 text-xs"
                >
                  {isSaving ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="h-7 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap [&_a]:no-underline [&_a]:text-foreground [&_a]:cursor-default" style={{ wordBreak: 'break-word' }}>
              {comment.content}
            </p>
          )}
          
          <div className="flex items-center space-x-2 mt-2">
            {canResolve && showResolveButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResolve}
                disabled={isResolving}
                className="h-7 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                {comment.isResolved ? 'Unresolve' : 'Resolve'}
              </Button>
            )}
            
            {/* Edit and Delete buttons for comment owner */}
            {isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  disabled={isEditing}
                  className="h-7 px-2"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="h-7 px-2"
                >
                  {isDeleting ? (
                    <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
