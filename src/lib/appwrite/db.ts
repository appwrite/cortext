import { Client, Databases, ID, type Models } from 'appwrite';
import type { Articles, ArticleSections } from './appwrite.types';

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
  articleSections: {
    create: (data: Omit<ArticleSections, keyof Models.Document>) => 
      databases.createDocument<ArticleSections>('imagine-project-db', 'article_sections', ID.unique(), data),
    get: (id: string) => 
      databases.getDocument<ArticleSections>('imagine-project-db', 'article_sections', id),
    update: (id: string, data: Partial<Omit<ArticleSections, keyof Models.Document>>) => 
      databases.updateDocument<ArticleSections>('imagine-project-db', 'article_sections', id, data),
    delete: (id: string) => 
      databases.deleteDocument('imagine-project-db', 'article_sections', id),
    list: (queries?: string[]) => 
      databases.listDocuments<ArticleSections>('imagine-project-db', 'article_sections', queries),
  }
};

export { client, databases };
