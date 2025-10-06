import { type Models } from 'appwrite';

export type Articles = Models.Document & {
    trailer: string | null;
    title: string | null;
    status: string | null;
    subtitle: string | null;
    images: string[] | null;
    body: string | null;
    authors: string[] | null;
    live: boolean;
    pinned: boolean;
    redirect: string | null;
    categories: string[] | null;
    createdBy: string | null;
    published: boolean;
    slug: string | null;
    publishedAt: string | null;
    blogId: string | null;
}

export type Authors = Models.Document & {
    firstname: string | null;
    lastname: string | null;
    title: string | null;
    biography: string | null;
    picture: string | null;
    email: string | null;
    facebook: string | null;
    twitter: string | null;
    googleplus: string | null;
    instagram: string | null;
    pinterest: string | null;
    blogId: string | null;
}

export type Categories = Models.Document & {
    name: string | null;
    slug: string | null;
    description: string | null;
    blogId: string | null;
}

export type Images = Models.Document & {
    file: string;
    caption: string | null;
    credits: string | null;
    blogId: string | null;
}

export type Notifications = Models.Document & {
    userId: string;
    title: string;
    message: string;
    type: string | null;
    read: boolean;
    actionUrl: string | null;
    actionText: string | null;
    blogId: string | null;
}

export type Blogs = Models.Document & {
    name: string;
    slug: string;
    description: string | null;
    domain: string | null;
    logo: string | null;
    favicon: string | null;
    theme: string | null;
    settings: string | null; // JSON string for custom settings
    ownerId: string;
    teamId: string;
    status: string; // 'active', 'inactive', 'suspended'
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string[] | null;
}

export type Comments = Models.Document & {
    content: string;
    authorId: string;
    authorName: string;
    authorEmail: string;
    articleId: string;
    blogId: string;
    targetType: string; // 'title', 'subtitle', 'body', 'section', 'image', etc.
    targetId: string | null; // For specific sections or blocks
    parentCommentId: string | null; // For replies
    isResolved: boolean;
    resolvedBy: string | null;
    resolvedAt: string | null;
    metadata: string | null; // JSON string for additional data
}

export type Conversations = Models.Document & {
    articleId: string;
    title: string;
    userId: string;
    agentId: string;
    blogId: string | null;
    lastMessageAt: string | null;
    messageCount: number;
}

export type Messages = Models.Document & {
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    userId: string;
    agentId: string;
    blogId: string | null;
    metadata: string | null; // JSON string for additional data like AI model used, etc.
    tokenCount: number | null; // Number of tokens in the message
    generationTimeMs: number | null; // Time taken to generate the message in milliseconds
}

