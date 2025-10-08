import { Client, Databases, ID, Permission, Role, Query, type Models } from 'appwrite';
import type { Articles, Authors, Categories, Images, Notifications, Blogs, Comments, Conversations, Messages, Revisions } from './appwrite.types';

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
  },
  conversations: {
    create: (data: Omit<Conversations, keyof Models.Document>, userId: string, teamId?: string) => 
      databases.createDocument<Conversations>(
        APPWRITE_DATABASE_ID, 
        'conversations', 
        ID.unique(), 
        data,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
          ...(teamId ? [
            Permission.read(Role.team(teamId)),
            Permission.update(Role.team(teamId)),
            Permission.delete(Role.team(teamId))
          ] : [])
        ]
      ),
    get: (id: string) => 
      databases.getDocument<Conversations>(APPWRITE_DATABASE_ID, 'conversations', id),
    update: (id: string, data: Partial<Omit<Conversations, keyof Models.Document>>) => 
      databases.updateDocument<Conversations>(APPWRITE_DATABASE_ID, 'conversations', id, data),
    delete: (id: string) => 
      databases.deleteDocument(APPWRITE_DATABASE_ID, 'conversations', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Conversations>(APPWRITE_DATABASE_ID, 'conversations', queries),
  },
  messages: {
    create: (data: Omit<Messages, keyof Models.Document>, userId: string, teamId?: string) => 
      databases.createDocument<Messages>(
        APPWRITE_DATABASE_ID, 
        'messages', 
        ID.unique(), 
        data,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
          ...(teamId ? [
            Permission.read(Role.team(teamId)),
            Permission.update(Role.team(teamId)),
            Permission.delete(Role.team(teamId))
          ] : [])
        ]
      ),
    get: (id: string) => 
      databases.getDocument<Messages>(APPWRITE_DATABASE_ID, 'messages', id),
    update: (id: string, data: Partial<Omit<Messages, keyof Models.Document>>) => 
      databases.updateDocument<Messages>(APPWRITE_DATABASE_ID, 'messages', id, data),
    delete: (id: string) => 
      databases.deleteDocument(APPWRITE_DATABASE_ID, 'messages', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Messages>(APPWRITE_DATABASE_ID, 'messages', queries),
  },
  revisions: {
    create: (data: Omit<Revisions, keyof Models.Document>, teamId?: string) => 
      databases.createDocument<Revisions>(
        APPWRITE_DATABASE_ID, 
        'revisions', 
        ID.unique(), 
        data,
        teamId ? [
          Permission.read(Role.team(teamId)),
          Permission.update(Role.team(teamId)),
          Permission.delete(Role.team(teamId))
        ] : undefined
      ),
    get: (id: string) => 
      databases.getDocument<Revisions>(APPWRITE_DATABASE_ID, 'revisions', id),
    update: (id: string, data: Partial<Omit<Revisions, keyof Models.Document>>) => 
      databases.updateDocument<Revisions>(APPWRITE_DATABASE_ID, 'revisions', id, data),
    delete: (id: string) => 
      databases.deleteDocument(APPWRITE_DATABASE_ID, 'revisions', id),
    list: (queries?: string[]) => 
      databases.listDocuments<Revisions>(APPWRITE_DATABASE_ID, 'revisions', queries),
  }
};

// Helper function to detect changes between two article states
export const detectChanges = (oldArticle: Articles, newArticle: Articles) => {
  const changes: string[] = [];
  const changedAttributes: Record<string, any> = {};

  // Check each attribute for changes
  const attributes = [
    'title', 'subtitle', 'trailer', 'status', 'live', 'pinned', 
    'redirect', 'slug', 'authors', 'categories', 'images'
  ];

  attributes.forEach(attr => {
    const oldValue = oldArticle[attr as keyof Articles];
    const newValue = newArticle[attr as keyof Articles];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changedAttributes[attr] = newValue;
      changes.push(`Updated ${attr}: ${oldValue} → ${newValue}`);
    }
  });

  // Check for body/sections changes
  if (oldArticle.body !== newArticle.body) {
    const oldSections = oldArticle.body ? JSON.parse(oldArticle.body) : [];
    const newSections = newArticle.body ? JSON.parse(newArticle.body) : [];
    
    // Track section changes by ID
    const sectionChanges = detectSectionChanges(oldSections, newSections);
    if (sectionChanges.length > 0) {
      changedAttributes.sections = sectionChanges;
      changes.push(...sectionChanges.map(change => `Section ${change.id}: ${change.action}`));
    }
  }

  return { changes, changedAttributes };
};

// Helper function to detect section-specific changes
export const detectSectionChanges = (oldSections: any[], newSections: any[]) => {
  const changes: any[] = [];
  
  // Create maps for easier lookup
  const oldSectionMap = new Map(oldSections.map(s => [s.id, s]));
  const newSectionMap = new Map(newSections.map(s => [s.id, s]));
  
  // Check for updated sections
  newSections.forEach(section => {
    const oldSection = oldSectionMap.get(section.id);
    if (oldSection) {
      // Section exists, check if content changed
      if (oldSection.content !== section.content || oldSection.type !== section.type) {
        changes.push({
          id: section.id,
          action: 'update',
          type: section.type,
          content: section.content,
          oldContent: oldSection.content
        });
      }
    } else if (section.id !== 'new') {
      // New section (not auto-generated)
      changes.push({
        id: section.id,
        action: 'create',
        type: section.type,
        content: section.content
      });
    }
  });
  
  // Check for deleted sections
  oldSections.forEach(section => {
    if (!newSectionMap.has(section.id)) {
      changes.push({
        id: section.id,
        action: 'delete',
        type: section.type,
        content: section.content
      });
    }
  });
  
  return changes;
};

// Helper function to create an initial revision for a new article
export const createInitialRevision = async (article: Articles, teamId?: string) => {
  const revisionData: Omit<Revisions, keyof Models.Document> = {
    articleId: article.$id,
    version: 1,
    status: 'draft',
    createdBy: article.createdBy,
    messageId: null,
    data: JSON.stringify({
      initial: true,
      // Store the complete article state directly (not nested in attributes)
      title: article.title,
      subtitle: article.subtitle,
      trailer: article.trailer,
      status: article.status,
      live: article.live,
      pinned: article.pinned,
      redirect: article.redirect,
      slug: article.slug,
      authors: article.authors,
      categories: article.categories,
      images: article.images,
      blogId: article.blogId,
      sections: article.body ? JSON.parse(article.body) : []
    }),
    changes: ['Initial article creation'],
    parentRevisionId: null,
  };

  return db.revisions.create(revisionData, teamId);
};

// Helper function to create a revision for article updates
export const createUpdateRevision = async (
  articleId: string, 
  oldArticle: Articles, 
  newArticle: Articles, 
  teamId?: string,
  messageId?: string
) => {
  const { changes, changedAttributes } = detectChanges(oldArticle, newArticle);
  
  if (changes.length === 0) {
    return null; // No changes detected
  }

  // Get the current revision to determine the next version
  const currentRevisions = await db.revisions.list([
    Query.equal('articleId', articleId),
    Query.orderDesc('version'),
    Query.limit(1)
  ]);
  
  const nextVersion = currentRevisions.documents.length > 0 
    ? currentRevisions.documents[0].version + 1 
    : 1;

  // Store the complete article state in the revision
  const revisionData: Omit<Revisions, keyof Models.Document> = {
    articleId: articleId,
    version: nextVersion,
    status: 'draft',
    createdBy: newArticle.createdBy,
    messageId: messageId || null,
    data: JSON.stringify({
      initial: false,
      // Store the complete article state
      title: newArticle.title,
      subtitle: newArticle.subtitle,
      trailer: newArticle.trailer,
      status: newArticle.status,
      live: newArticle.live,
      pinned: newArticle.pinned,
      redirect: newArticle.redirect,
      slug: newArticle.slug,
      authors: newArticle.authors,
      categories: newArticle.categories,
      images: newArticle.images,
      blogId: newArticle.blogId,
      // Store sections separately
      sections: newArticle.body ? JSON.parse(newArticle.body) : [],
      // Also store what changed for reference
      changedAttributes,
      timestamp: new Date().toISOString()
    }),
    changes: changes,
    parentRevisionId: currentRevisions.documents[0]?.$id || null,
  };

  return db.revisions.create(revisionData, teamId);
};

// Helper function to create a revision for reverting (always creates a revision)
export const createRevertRevision = async (
  articleId: string, 
  oldArticle: Articles, 
  newArticle: Articles, 
  teamId?: string,
  messageId?: string
) => {
  // Get the current revision to determine the next version
  const currentRevisions = await db.revisions.list([
    Query.equal('articleId', articleId),
    Query.orderDesc('version'),
    Query.limit(1)
  ]);
  
  const nextVersion = currentRevisions.documents.length > 0 
    ? currentRevisions.documents[0].version + 1 
    : 1;

  // Store the complete article state in the revision
  const revisionData: Omit<Revisions, keyof Models.Document> = {
    articleId: articleId,
    version: nextVersion,
    status: 'draft',
    createdBy: newArticle.createdBy,
    messageId: messageId || null,
    data: JSON.stringify({
      initial: false,
      // Store the complete article state
      title: newArticle.title,
      subtitle: newArticle.subtitle,
      trailer: newArticle.trailer,
      status: newArticle.status,
      live: newArticle.live,
      pinned: newArticle.pinned,
      redirect: newArticle.redirect,
      slug: newArticle.slug,
      authors: newArticle.authors,
      categories: newArticle.categories,
      images: newArticle.images,
      blogId: newArticle.blogId,
      // Store sections separately
      sections: newArticle.body ? JSON.parse(newArticle.body) : [],
      // Mark this as a revert
      isRevert: true,
      timestamp: new Date().toISOString()
    }),
    changes: [`Reverted to previous version`],
    parentRevisionId: currentRevisions.documents[0]?.$id || null,
  };

  return db.revisions.create(revisionData, teamId);
};

export { client, databases };
