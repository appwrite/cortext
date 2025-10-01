import { type Models } from 'appwrite';

export type Articles = Models.Document & {
    createdBy: string;
    title: string;
    slug: string | null;
    excerpt: string | null;
    coverImageId: string | null;
    published: boolean;
    publishedAt: number | null;
    pinned: boolean;
}

export type ArticleSections = Models.Document & {
    createdBy: string;
    articleId: string;
    type: string;
    position: number;
    content: string | null;
    mediaId: string | null;
    embedUrl: string | null;
    data: string | null;
    caption: string | null;
    speaker: string | null;
}
