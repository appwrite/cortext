// Example of how to use the optimized comment system in the content
// This shows the before and after approach

// BEFORE (current approach - causes re-renders on input changes):
/*
<CommentableInput
    articleId={articleId}
    blogId={currentBlog?.$id || ''}
    targetType="trailer"
    commentCount={trailerCommentCount.count}
    hasNewComments={trailerCommentCount.hasNewComments}
>
    <Input id="trailer" value={trailer} onChange={handleTrailerChange} placeholder="Breaking news, Exclusive..." disabled={isInRevertMode} />
</CommentableInput>
*/

// AFTER (optimized approach - no re-renders on input changes):
/*
<div className="relative group">
    <Input id="trailer" value={trailer} onChange={handleTrailerChange} placeholder="Breaking news, Exclusive..." disabled={isInRevertMode} />
    <CommentOverlay
        articleId={articleId}
        blogId={currentBlog?.$id || ''}
        targetType="trailer"
        commentCount={trailerCommentCount.count}
        hasNewComments={trailerCommentCount.hasNewComments}
    />
</div>
*/

// OR using the OptimizedCommentableInput wrapper:
/*
<OptimizedCommentableInput
    articleId={articleId}
    blogId={currentBlog?.$id || ''}
    targetType="trailer"
    commentCount={trailerCommentCount.count}
    hasNewComments={trailerCommentCount.hasNewComments}
>
    <Input id="trailer" value={trailer} onChange={handleTrailerChange} placeholder="Breaking news, Exclusive..." disabled={isInRevertMode} />
</OptimizedCommentableInput>
*/

// Key optimizations made:
// 1. Memoized all comment components to prevent unnecessary re-renders
// 2. Separated comment UI from input state using absolute positioning
// 3. Optimized comment count calculations to be stable during typing
// 4. Used useCallback for all event handlers
// 5. Added ref-based caching for comment counts
// 6. Made comment icons completely independent of input value changes

// Performance benefits:
// - No re-renders of comment components when typing in inputs
// - Comment counts are cached and only recalculated when comments actually change
// - Comment popovers don't re-render unless they're actually opened/closed
// - Input typing performance is significantly improved
