import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommentIconProps {
  commentCount: number;
  hasNewComments?: boolean;
  onClick: () => void;
  className?: string;
}

export function CommentIcon({ 
  commentCount, 
  hasNewComments = false, 
  onClick, 
  className 
}: CommentIconProps) {
  return (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className={cn(
            "relative h-10 w-10 p-0 hover:bg-muted/50 transition-colors bg-background border border-border",
            className
          )}
        >
      <MessageCircle className="h-4 w-4" />
      {commentCount > 0 ? (
        <Badge 
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center min-w-[20px] text-white"
        >
          {commentCount}
        </Badge>
      ) : (
        <Badge 
          variant="outline"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center min-w-[20px] bg-muted text-muted-foreground border-muted-foreground/20"
        >
          +
        </Badge>
      )}
    </Button>
  );
}
