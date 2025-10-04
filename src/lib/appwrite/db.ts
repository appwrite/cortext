import { Client, Databases, ID, Permission, Role, type Models } from 'appwrite';
import type { Articles, Authors, Categories, Images, Notifications, Blogs, Comments } from './appwrite.types';

// Environment variables validation
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

if (!APPWRITE_ENDPOINT) {
  throw new Error('VITE_APPWRITE_ENDPOINT environment variable is required');
}

if (!APPWRITE_PROJECT_ID) {
  throw new Error('VITE_APPWRITE_PROJECT_ID environment variable is required');
}

if (!APPWRITE_DATABASE_ID) {
  throw new Error('VITE_APPWRITE_DATABASE_ID environment variable is required');
}

const client = new Client();
const databases = new Databases(client);

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const db = {
  articles: {
    create: (data: Omit<Articles, keyof Models.Document>, teamId?: string) => 
      databases.createDocument<Articles>(
        APPWRITE_DATABASE_ID, 
        'articles', 
        ID.unique(), 
        data,
        teamId ? [
          Permission.read(Role.team(teamId)),
          Permission.update(Role.team(teamId)),
          Permission.delete(Role.team(teamId))
        ] : undefined
      ),
    get: (id: string) => 
      databases.getDocument<Articles>(APPWRITE_DATABASE_ID, 'articles', id),
    update: (id: string, data: Partial<Omit<Articles, keyof Models.Document>>) => 
      databases.updateDocument<Articles>(APPWRITE_DATABASE_ID, 'articles', id, data),
    delete: (id: string) => 
      databases.deleteDocument(APPWRITE_DATABASE_ID, 'articles', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Articles>(APPWRITE_DATABASE_ID, 'articles', queries),
  },
  authors: {
    create: (data: Omit<Authors, keyof Models.Document>, teamId?: string) => 
      databases.createDocument<Authors>(
        APPWRITE_DATABASE_ID, 
        'authors', 
        ID.unique(), 
        data,
        teamId ? [
          Permission.read(Role.team(teamId)),
          Permission.update(Role.team(teamId)),
          Permission.delete(Role.team(teamId))
        ] : undefined
      ),
    get: (id: string) => 
      databases.getDocument<Authors>(APPWRITE_DATABASE_ID, 'authors', id),
    update: (id: string, data: Partial<Omit<Authors, keyof Models.Document>>) => 
      databases.updateDocument<Authors>(APPWRITE_DATABASE_ID, 'authors', id, data),
    delete: (id: string) => 
      databases.deleteDocument(APPWRITE_DATABASE_ID, 'authors', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Authors>(APPWRITE_DATABASE_ID, 'authors', queries),
  },
  categories: {
    create: (data: Omit<Categories, keyof Models.Document>, teamId?: string) => 
      databases.createDocument<Categories>(
        APPWRITE_DATABASE_ID, 
        'categories', 
        ID.unique(), 
        data,
        teamId ? [
          Permission.read(Role.team(teamId)),
          Permission.update(Role.team(teamId)),
          Permission.delete(Role.team(teamId))
        ] : undefined
      ),
    get: (id: string) => 
      databases.getDocument<Categories>(APPWRITE_DATABASE_ID, 'categories', id),
    update: (id: string, data: Partial<Omit<Categories, keyof Models.Document>>) => 
      databases.updateDocument<Categories>(APPWRITE_DATABASE_ID, 'categories', id, data),
    delete: (id: string) => 
      databases.deleteDocument(APPWRITE_DATABASE_ID, 'categories', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Categories>(APPWRITE_DATABASE_ID, 'categories', queries),
  },
  images: {
    create: (data: Omit<Images, keyof Models.Document>, teamId?: string) => 
      databases.createDocument<Images>(
        APPWRITE_DATABASE_ID, 
        'images', 
        ID.unique(), 
        data,
        teamId ? [
          Permission.read(Role.team(teamId)),
          Permission.update(Role.team(teamId)),
          Permission.delete(Role.team(teamId))
        ] : undefined
      ),
    get: (id: string) => 
      databases.getDocument<Images>(APPWRITE_DATABASE_ID, 'images', id),
    update: (id: string, data: Partial<Omit<Images, keyof Models.Document>>) => 
      databases.updateDocument<Images>(APPWRITE_DATABASE_ID, 'images', id, data),
    delete: (id: string) => 
      databases.deleteDocument(APPWRITE_DATABASE_ID, 'images', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Images>(APPWRITE_DATABASE_ID, 'images', queries),
  },
  notifications: {
    create: (data: Omit<Notifications, keyof Models.Document>) => 
      databases.createDocument<Notifications>(APPWRITE_DATABASE_ID, 'notifications', ID.unique(), data),
    get: (id: string) => 
      databases.getDocument<Notifications>(APPWRITE_DATABASE_ID, 'notifications', id),
    update: (id: string, data: Partial<Omit<Notifications, keyof Models.Document>>) => 
      databases.updateDocument<Notifications>(APPWRITE_DATABASE_ID, 'notifications', id, data),
    delete: (id: string) => 
      databases.deleteDocument(APPWRITE_DATABASE_ID, 'notifications', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Notifications>(APPWRITE_DATABASE_ID, 'notifications', queries),
  },
  blogs: {
    create: (data: Omit<Blogs, keyof Models.Document>, teamId?: string) => 
      databases.createDocument<Blogs>(
        APPWRITE_DATABASE_ID, 
        'blogs', 
        ID.unique(), 
        data,
        teamId ? [
          Permission.read(Role.team(teamId)),
          Permission.update(Role.team(teamId)),
          Permission.delete(Role.team(teamId))
        ] : undefined
      ),
    get: (id: string) => 
      databases.getDocument<Blogs>(APPWRITE_DATABASE_ID, 'blogs', id),
    update: (id: string, data: Partial<Omit<Blogs, keyof Models.Document>>) => 
      databases.updateDocument<Blogs>(APPWRITE_DATABASE_ID, 'blogs', id, data),
    delete: (id: string) => 
      databases.deleteDocument(APPWRITE_DATABASE_ID, 'blogs', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Blogs>(APPWRITE_DATABASE_ID, 'blogs', queries),
  },
  comments: {
    create: (data: Omit<Comments, keyof Models.Document>, teamId?: string) => 
      databases.createDocument<Comments>(
        APPWRITE_DATABASE_ID, 
        'comments', 
        ID.unique(), 
        data,
        teamId ? [
          Permission.read(Role.team(teamId)),
          Permission.update(Role.team(teamId)),
          Permission.delete(Role.team(teamId))
        ] : undefined
      ),
    get: (id: string) => 
      databases.getDocument<Comments>(APPWRITE_DATABASE_ID, 'comments', id),
    update: (id: string, data: Partial<Omit<Comments, keyof Models.Document>>) => 
      databases.updateDocument<Comments>(APPWRITE_DATABASE_ID, 'comments', id, data),
    delete: (id: string) => 
      databases.deleteDocument(APPWRITE_DATABASE_ID, 'comments', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Comments>(APPWRITE_DATABASE_ID, 'comments', queries),
  }
};

export { client, databases };
