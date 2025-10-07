import { Query } from 'appwrite';

/**
 * Utility functions for multi-blog support
 */

/**
 * Create a query to filter by blog ID
 */
export const byBlogId = (blogId: string) => Query.equal('blogId', blogId);


/**
 * Create a query to filter by blog ID and status
 */
export const byBlogIdAndStatus = (blogId: string, status: string) => [
  Query.equal('blogId', blogId),
  Query.equal('status', status)
];

/**
 * Create a query to filter by blog ID and user ID
 */
export const byBlogIdAndUserId = (blogId: string, userId: string) => [
  Query.equal('blogId', blogId),
  Query.equal('userId', userId)
];

/**
 * Create a query to filter by blog ID and read status
 */
export const byBlogIdAndReadStatus = (blogId: string, read: boolean) => [
  Query.equal('blogId', blogId),
  Query.equal('read', read)
];

/**
 * Create a query to filter by blog ID and category slug
 */
export const byBlogIdAndCategorySlug = (blogId: string, slug: string) => [
  Query.equal('blogId', blogId),
  Query.equal('slug', slug)
];

/**
 * Create a query to filter by blog ID and author email
 */
export const byBlogIdAndAuthorEmail = (blogId: string, email: string) => [
  Query.equal('blogId', blogId),
  Query.equal('email', email)
];

/**
 * Create a query to filter by blog ID and article slug
 */
export const byBlogIdAndArticleSlug = (blogId: string, slug: string) => [
  Query.equal('blogId', blogId),
  Query.equal('slug', slug)
];

/**
 * Create a query to filter by blog ID and file name
 */
export const byBlogIdAndFileName = (blogId: string, file: string) => [
  Query.equal('blogId', blogId),
  Query.equal('file', file)
];

/**
 * Create a query to get blogs by owner ID
 */
export const byOwnerId = (ownerId: string) => Query.equal('ownerId', ownerId);

/**
 * Create a query to get blogs by status
 */
export const byStatus = (status: string) => Query.equal('status', status);

/**
 * Create a query to get blogs by domain
 */
export const byDomain = (domain: string) => Query.equal('domain', domain);

/**
 * Create a query to get blogs by slug
 */
export const bySlug = (slug: string) => Query.equal('slug', slug);

/**
 * Create a query to get active blogs
 */
export const activeBlogs = () => Query.equal('status', 'active');

/**
 * Create a query to get blogs by owner and status
 */
export const byOwnerAndStatus = (ownerId: string, status: string) => [
  Query.equal('ownerId', ownerId),
  Query.equal('status', status)
];
