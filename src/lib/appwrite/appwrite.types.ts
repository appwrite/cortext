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
    status: string; // 'active', 'inactive', 'suspended'
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string[] | null;
    socialLinks: string | null; // JSON string for social media links
    analyticsId: string | null;
    customCss: string | null;
    customJs: string | null;
}

