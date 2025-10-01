import { Client, Databases, ID, type Models } from 'appwrite';
import type { Articles, Authors, Categories, Images } from './appwrite.types';

const client = new Client();
const databases = new Databases(client);

client
  .setEndpoint('https://stage.cloud.appwrite.io/v1')
  .setProject('68af6eea000565837b93');

export const db = {
  articles: {
    create: (data: Omit<Articles, keyof Models.Document>) => 
      databases.createDocument<Articles>('imagine-project-db', 'articles', ID.unique(), data),
    get: (id: string) => 
      databases.getDocument<Articles>('imagine-project-db', 'articles', id),
    update: (id: string, data: Partial<Omit<Articles, keyof Models.Document>>) => 
      databases.updateDocument<Articles>('imagine-project-db', 'articles', id, data),
    delete: (id: string) => 
      databases.deleteDocument('imagine-project-db', 'articles', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Articles>('imagine-project-db', 'articles', queries),
  },
  authors: {
    create: (data: Omit<Authors, keyof Models.Document>) => 
      databases.createDocument<Authors>('imagine-project-db', 'authors', ID.unique(), data),
    get: (id: string) => 
      databases.getDocument<Authors>('imagine-project-db', 'authors', id),
    update: (id: string, data: Partial<Omit<Authors, keyof Models.Document>>) => 
      databases.updateDocument<Authors>('imagine-project-db', 'authors', id, data),
    delete: (id: string) => 
      databases.deleteDocument('imagine-project-db', 'authors', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Authors>('imagine-project-db', 'authors', queries),
  },
  categories: {
    create: (data: Omit<Categories, keyof Models.Document>) => 
      databases.createDocument<Categories>('imagine-project-db', 'categories', ID.unique(), data),
    get: (id: string) => 
      databases.getDocument<Categories>('imagine-project-db', 'categories', id),
    update: (id: string, data: Partial<Omit<Categories, keyof Models.Document>>) => 
      databases.updateDocument<Categories>('imagine-project-db', 'categories', id, data),
    delete: (id: string) => 
      databases.deleteDocument('imagine-project-db', 'categories', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Categories>('imagine-project-db', 'categories', queries),
  },
  images: {
    create: (data: Omit<Images, keyof Models.Document>) => 
      databases.createDocument<Images>('imagine-project-db', 'images', ID.unique(), data),
    get: (id: string) => 
      databases.getDocument<Images>('imagine-project-db', 'images', id),
    update: (id: string, data: Partial<Omit<Images, keyof Models.Document>>) => 
      databases.updateDocument<Images>('imagine-project-db', 'images', id, data),
    delete: (id: string) => 
      databases.deleteDocument('imagine-project-db', 'images', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Images>('imagine-project-db', 'images', queries),
  }
};

export { client, databases };
