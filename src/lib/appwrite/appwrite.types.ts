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
}

export type Categories = Models.Document & {
    name: string | null;
    slug: string | null;
    description: string | null;
}

export type Images = Models.Document & {
    file: string;
    caption: string | null;
    credits: string | null;
}
