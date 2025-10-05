import React from 'react';
import { CommentableInput } from './commentable-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CommentTest() {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-lg font-semibold">Comment System Test</h2>
      
      <div>
        <Label htmlFor="test-title">Test Title</Label>
        <CommentableInput
          articleId="test-article"
          blogId="test-blog"
          targetType="title"
          commentCount={3}
          hasNewComments={true}
        >
          <Input id="test-title" placeholder="Test title input" />
        </CommentableInput>
      </div>
      
      <div>
        <Label htmlFor="test-subtitle">Test Subtitle</Label>
        <CommentableInput
          articleId="test-article"
          blogId="test-blog"
          targetType="subtitle"
          commentCount={0}
          hasNewComments={false}
        >
          <Input id="test-subtitle" placeholder="Test subtitle input" />
        </CommentableInput>
      </div>
    </div>
  );
}
