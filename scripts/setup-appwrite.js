#!/usr/bin/env node

import { Client, Databases, Storage, Functions, ID, Permission, Role, Query } from 'node-appwrite';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createReadStream } from 'fs';

/**
 * INDEX LENGTH STRATEGY:
 * 
 * Database indexes have a maximum length of 767 bytes. For UTF-8 strings, this means:
 * - Safe for indexing: ≤ 191 characters (191 × 4 bytes = 764 bytes)
 * - Large fields that need indexing: Use lengths: [191] parameter
 * 
 * Large fields (> 767 bytes when indexed):
 * - title (1024 chars) → indexed with lengths: [191] ✅
 * - subtitle (2048 chars) → not indexed, but use lengths: [191] if indexed later
 * - body (200000 chars) → not indexed, but use lengths: [191] if indexed later  
 * - biography (2048 chars) → not indexed, but use lengths: [191] if indexed later
 * - description (2048 chars) → not indexed, but use lengths: [191] if indexed later
 * - caption (2048 chars) → not indexed, but use lengths: [191] if indexed later
 * 
 * Medium fields (500-512 chars) are safe for full indexing.
 */

// Configuration
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

if (!APPWRITE_ENDPOINT) {
  console.error('❌ APPWRITE_ENDPOINT environment variable is required');
  process.exit(1);
}

if (!APPWRITE_PROJECT_ID) {
  console.error('❌ APPWRITE_PROJECT_ID environment variable is required');
  process.exit(1);
}

if (!APPWRITE_API_KEY) {
  console.error('❌ APPWRITE_API_KEY environment variable is required');
  process.exit(1);
}

if (!APPWRITE_DATABASE_ID) {
  console.error('❌ APPWRITE_DATABASE_ID environment variable is required');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);

// Database configuration
const DATABASE_ID = APPWRITE_DATABASE_ID;
const DATABASE_NAME = 'Imagine Project Database';

// Collections configuration
const COLLECTIONS = {
  articles: {
    name: 'Articles',
    permissions: [Permission.create(Role.any())],
    attributes: [
      { key: 'trailer', type: 'string', size: 512, required: false, array: false, default: null },
      { key: 'title', type: 'string', size: 1024, required: false, array: false, default: null },
      { key: 'status', type: 'string', size: 50, required: false, array: false, default: 'draft' },
      { key: 'subtitle', type: 'string', size: 2048, required: false, array: false, default: null },
      { key: 'images', type: 'string', size: 512, required: false, array: true, default: null },
      { key: 'body', type: 'string', size: 200000, required: false, array: false, default: null },
      { key: 'authors', type: 'string', size: 512, required: false, array: true, default: null },
      { key: 'live', type: 'boolean', required: false, array: false, default: false },
      { key: 'pinned', type: 'boolean', required: false, array: false, default: false },
      { key: 'redirect', type: 'string', size: 500, required: false, array: false, default: null },
      { key: 'categories', type: 'string', size: 512, required: false, array: true, default: null },
      { key: 'createdBy', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'slug', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'activeRevisionId', type: 'string', size: 255, required: false, array: false, default: null }, // Reference to current active revision
      { key: 'blogId', type: 'string', size: 255, required: false, array: false, default: null },
    ],
    indexes: [
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'live', type: 'key', attributes: ['live'] },
      { key: 'pinned', type: 'key', attributes: ['pinned'] },
      { key: 'title', type: 'key', attributes: ['title'], lengths: [191] },
      { key: 'title_fulltext', type: 'fulltext', attributes: ['title'] },
      { key: 'blogId', type: 'key', attributes: ['blogId'] },
      { key: 'blogId_status', type: 'key', attributes: ['blogId', 'status'] },
      { key: 'blogId_slug', type: 'unique', attributes: ['blogId', 'slug'] },
      { key: 'activeRevisionId', type: 'key', attributes: ['activeRevisionId'] },
      // Note: subtitle, body are large fields (2048+ chars) - if indexed in future, use lengths: [191]
    ],
  },
  authors: {
    name: 'Authors',
    permissions: [Permission.create(Role.any())],
    attributes: [
      { key: 'firstname', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'lastname', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'title', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'biography', type: 'string', size: 2048, required: false, array: false, default: null },
      { key: 'picture', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'email', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'facebook', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'twitter', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'googleplus', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'instagram', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'pinterest', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'blogId', type: 'string', size: 255, required: false, array: false, default: null },
    ],
    indexes: [
      { key: 'firstname', type: 'key', attributes: ['firstname'] },
      { key: 'lastname', type: 'key', attributes: ['lastname'] },
      { key: 'email', type: 'unique', attributes: ['email'] },
      { key: 'blogId', type: 'key', attributes: ['blogId'] },
      { key: 'blogId_email', type: 'unique', attributes: ['blogId', 'email'] },
      // Note: biography is large field (2048 chars) - if indexed in future, use lengths: [191]
    ],
  },
  categories: {
    name: 'Categories',
    permissions: [Permission.create(Role.any())],
    attributes: [
      { key: 'name', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'slug', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'description', type: 'string', size: 2048, required: false, array: false, default: null },
      { key: 'blogId', type: 'string', size: 255, required: false, array: false, default: null },
    ],
    indexes: [
      { key: 'name', type: 'key', attributes: ['name'] },
      { key: 'slug', type: 'unique', attributes: ['slug'] },
      { key: 'blogId', type: 'key', attributes: ['blogId'] },
      { key: 'blogId_slug', type: 'unique', attributes: ['blogId', 'slug'] },
      // Note: description is large field (2048 chars) - if indexed in future, use lengths: [191]
    ],
  },
  images: {
    name: 'Images',
    permissions: [Permission.create(Role.any())],
    attributes: [
      { key: 'file', type: 'string', size: 256, required: true, array: false, default: null },
      { key: 'caption', type: 'string', size: 2048, required: false, array: false, default: null },
      { key: 'credits', type: 'string', size: 256, required: false, array: false, default: null },
      { key: 'blogId', type: 'string', size: 255, required: false, array: false, default: null },
    ],
    indexes: [
      { key: 'file', type: 'key', attributes: ['file'] },
      { key: 'blogId', type: 'key', attributes: ['blogId'] },
      // Note: caption is large field (2048 chars) - if indexed in future, use lengths: [191]
    ],
  },
  notifications: {
    name: 'Notifications',
    permissions: [],
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'title', type: 'string', size: 512, required: true, array: false, default: null },
      { key: 'message', type: 'string', size: 2048, required: true, array: false, default: null },
      { key: 'type', type: 'string', size: 50, required: false, array: false, default: 'info' },
      { key: 'read', type: 'boolean', required: false, array: false, default: false },
      { key: 'actionUrl', type: 'string', size: 512, required: false, array: false, default: null },
      { key: 'actionText', type: 'string', size: 100, required: false, array: false, default: null },
      { key: 'blogId', type: 'string', size: 255, required: false, array: false, default: null },
    ],
    indexes: [
      { key: 'userId', type: 'key', attributes: ['userId'] },
      { key: 'read', type: 'key', attributes: ['read'] },
      { key: 'userId_read', type: 'key', attributes: ['userId', 'read'] },
      { key: 'createdAt', type: 'key', attributes: ['$createdAt'] },
      { key: 'blogId', type: 'key', attributes: ['blogId'] },
      { key: 'blogId_userId', type: 'key', attributes: ['blogId', 'userId'] },
    ],
  },
  blogs: {
    name: 'Blogs',
    permissions: [Permission.create(Role.any())],
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'slug', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'description', type: 'string', size: 2048, required: false, array: false, default: null },
      { key: 'theme', type: 'string', size: 100, required: false, array: false, default: 'default' },
      { key: 'teamId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'status', type: 'string', size: 50, required: false, array: false, default: 'active' },
      { key: 'seoTitle', type: 'string', size: 512, required: false, array: false, default: null },
      { key: 'seoDescription', type: 'string', size: 1024, required: false, array: false, default: null },
      { key: 'seoKeywords', type: 'string', size: 512, required: false, array: true, default: null },
    ],
    indexes: [
      { key: 'name', type: 'key', attributes: ['name'] },
      { key: 'slug', type: 'unique', attributes: ['slug'] },
      { key: 'domain', type: 'unique', attributes: ['domain'] },
      { key: 'ownerId', type: 'key', attributes: ['ownerId'] },
      { key: 'teamId', type: 'key', attributes: ['teamId'] },
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'ownerId_status', type: 'key', attributes: ['ownerId', 'status'] },
      // Note: description, settings are large fields - if indexed in future, use lengths: [191]
    ],
  },
  agents: {
    name: 'Agents',
    permissions: [Permission.create(Role.any())],
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'description', type: 'string', size: 1024, required: false, array: false, default: null },
      { key: 'model', type: 'string', size: 100, required: true, array: false, default: null },
      { key: 'apiKey', type: 'string', size: 512, required: true, array: false, default: null }, // Encrypted
      { key: 'temperature', type: 'float', required: false, array: false, default: 0.7, min: 0, max: 2.0 },
      { key: 'maxTokens', type: 'integer', required: false, array: false, default: 2000 },
      { key: 'systemPrompt', type: 'string', size: 200000, required: false, array: false, default: null },
      { key: 'capabilities', type: 'string', size: 512, required: false, array: true, default: null },
      { key: 'isActive', type: 'boolean', required: false, array: false, default: true },
      { key: 'blogId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'createdBy', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'settings', type: 'string', size: 200000, required: false, array: false, default: null }, // JSON string for additional settings
    ],
    indexes: [
      { key: 'name', type: 'key', attributes: ['name'] },
      { key: 'model', type: 'key', attributes: ['model'] },
      { key: 'isActive', type: 'key', attributes: ['isActive'] },
      { key: 'blogId', type: 'key', attributes: ['blogId'] },
      { key: 'createdBy', type: 'key', attributes: ['createdBy'] },
      { key: 'blogId_isActive', type: 'key', attributes: ['blogId', 'isActive'] },
      { key: 'blogId_createdBy', type: 'key', attributes: ['blogId', 'createdBy'] },
    ],
  },
  conversations: {
    name: 'Conversations',
    permissions: [Permission.create(Role.any())],
    attributes: [
      { key: 'title', type: 'string', size: 512, required: false, array: false, default: null },
      { key: 'userId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'agentId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'articleId', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'blogId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'status', type: 'string', size: 50, required: false, array: false, default: 'active' },
      { key: 'context', type: 'string', size: 5000, required: false, array: false, default: null }, // JSON string for conversation context
      { key: 'lastMessageAt', type: 'datetime', required: false, array: false, default: null },
      { key: 'messageCount', type: 'integer', required: false, array: false, default: 0 },
      { key: 'isArchived', type: 'boolean', required: false, array: false, default: false },
    ],
    indexes: [
      { key: 'userId', type: 'key', attributes: ['userId'] },
      { key: 'agentId', type: 'key', attributes: ['agentId'] },
      { key: 'articleId', type: 'key', attributes: ['articleId'] },
      { key: 'blogId', type: 'key', attributes: ['blogId'] },
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'isArchived', type: 'key', attributes: ['isArchived'] },
      { key: 'lastMessageAt', type: 'key', attributes: ['lastMessageAt'] },
      { key: 'userId_blogId', type: 'key', attributes: ['userId', 'blogId'] },
      { key: 'agentId_blogId', type: 'key', attributes: ['agentId', 'blogId'] },
      { key: 'articleId_blogId', type: 'key', attributes: ['articleId', 'blogId'] },
      { key: 'userId_status', type: 'key', attributes: ['userId', 'status'] },
      { key: 'blogId_status', type: 'key', attributes: ['blogId', 'status'] },
    ],
  },
  messages: {
    name: 'Messages',
    permissions: [Permission.create(Role.any())],
    attributes: [
      { key: 'conversationId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'content', type: 'string', size: 50000, required: true, array: false, default: null },
      { key: 'role', type: 'string', size: 20, required: true, array: false, default: null }, // 'user', 'assistant', 'system'
      { key: 'userId', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'agentId', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'blogId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'revisionId', type: 'string', size: 255, required: false, array: false, default: null }, // Reference to revision ID
      { key: 'metadata', type: 'string', size: 2000, required: false, array: false, default: null }, // JSON string for additional metadata
      { key: 'tokens', type: 'integer', required: false, array: false, default: null },
      { key: 'tokenCount', type: 'integer', required: false, array: false, default: null }, // Number of tokens in the message
      { key: 'generationTimeMs', type: 'integer', required: false, array: false, default: null }, // Time taken to generate the message in milliseconds
      { key: 'isEdited', type: 'boolean', required: false, array: false, default: false },
      { key: 'parentMessageId', type: 'string', size: 255, required: false, array: false, default: null }, // For message threading
    ],
    indexes: [
      { key: 'conversationId', type: 'key', attributes: ['conversationId'] },
      { key: 'role', type: 'key', attributes: ['role'] },
      { key: 'userId', type: 'key', attributes: ['userId'] },
      { key: 'agentId', type: 'key', attributes: ['agentId'] },
      { key: 'blogId', type: 'key', attributes: ['blogId'] },
      { key: 'revisionId', type: 'key', attributes: ['revisionId'] },
      { key: 'isEdited', type: 'key', attributes: ['isEdited'] },
      { key: 'parentMessageId', type: 'key', attributes: ['parentMessageId'] },
      { key: 'conversationId_role', type: 'key', attributes: ['conversationId', 'role'] },
      { key: 'conversationId_createdAt', type: 'key', attributes: ['conversationId', '$createdAt'] },
      { key: 'blogId_conversationId', type: 'key', attributes: ['blogId', 'conversationId'] },
      { key: 'revisionId_blogId', type: 'key', attributes: ['revisionId', 'blogId'] },
    ],
  },
  comments: {
    name: 'Comments',
    permissions: [Permission.create(Role.any())],
    attributes: [
      { key: 'content', type: 'string', size: 5000, required: true, array: false, default: null },
      { key: 'authorId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'authorName', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'authorEmail', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'articleId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'blogId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'targetType', type: 'string', size: 50, required: true, array: false, default: null }, // 'title', 'subtitle', 'body', 'section', 'image', etc.
      { key: 'targetId', type: 'string', size: 255, required: false, array: false, default: null }, // For specific sections or blocks
      { key: 'parentCommentId', type: 'string', size: 255, required: false, array: false, default: null }, // For replies
      { key: 'isResolved', type: 'boolean', required: false, array: false, default: false },
      { key: 'resolvedBy', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'resolvedAt', type: 'datetime', required: false, array: false, default: null },
      { key: 'metadata', type: 'string', size: 2000, required: false, array: false, default: null }, // JSON string for additional data
    ],
    indexes: [
      { key: 'articleId', type: 'key', attributes: ['articleId'] },
      { key: 'blogId', type: 'key', attributes: ['blogId'] },
      { key: 'authorId', type: 'key', attributes: ['authorId'] },
      { key: 'targetType', type: 'key', attributes: ['targetType'] },
      { key: 'targetId', type: 'key', attributes: ['targetId'] },
      { key: 'parentCommentId', type: 'key', attributes: ['parentCommentId'] },
      { key: 'isResolved', type: 'key', attributes: ['isResolved'] },
      { key: 'createdAt', type: 'key', attributes: ['$createdAt'] },
      { key: 'articleId_targetType', type: 'key', attributes: ['articleId', 'targetType'] },
      { key: 'articleId_targetId', type: 'key', attributes: ['articleId', 'targetId'] },
      { key: 'blogId_articleId', type: 'key', attributes: ['blogId', 'articleId'] },
      { key: 'parentCommentId_createdAt', type: 'key', attributes: ['parentCommentId', '$createdAt'] },
      { key: 'isResolved_createdAt', type: 'key', attributes: ['isResolved', '$createdAt'] },
    ],
  },
  revisions: {
    name: 'Revisions',
    permissions: [Permission.create(Role.any())],
    attributes: [
      { key: 'articleId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'version', type: 'integer', required: true, array: false, default: null },
      { key: 'status', type: 'string', size: 50, required: false, array: false, default: 'draft' },
      { key: 'createdBy', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'userId', type: 'string', size: 255, required: false, array: false, default: null }, // User ID who created the revision
      { key: 'userName', type: 'string', size: 255, required: false, array: false, default: null }, // User name who created the revision
      { key: 'userEmail', type: 'string', size: 255, required: false, array: false, default: null }, // User email who created the revision
      { key: 'messageId', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'data', type: 'string', size: 200000, required: true, array: false, default: null }, // JSON string for full article snapshot
      { key: 'changes', type: 'string', size: 1000, required: false, array: true, default: null }, // Array of change descriptions
      { key: 'parentRevisionId', type: 'string', size: 255, required: false, array: false, default: null },
    ],
    indexes: [
      { key: 'articleId', type: 'key', attributes: ['articleId'] },
      { key: 'articleId_version', type: 'unique', attributes: ['articleId', 'version'] },
      { key: 'articleId_status', type: 'key', attributes: ['articleId', 'status'] },
      { key: 'messageId', type: 'key', attributes: ['messageId'] },
      { key: 'createdBy', type: 'key', attributes: ['createdBy'] },
      { key: 'userId', type: 'key', attributes: ['userId'] },
      { key: 'userEmail', type: 'key', attributes: ['userEmail'] },
      { key: 'parentRevisionId', type: 'key', attributes: ['parentRevisionId'] },
      { key: 'createdAt', type: 'key', attributes: ['$createdAt'] },
      { key: 'articleId_userId', type: 'key', attributes: ['articleId', 'userId'] },
      { key: 'userId_createdAt', type: 'key', attributes: ['userId', '$createdAt'] },
    ],
  },
};

// Storage configuration
const STORAGE_BUCKETS = {
  'images': {
    name: 'Images',
    permissions: [],
    fileSecurity: true,
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'],
    maxFileSize: 10485760, // 10MB
    encryption: true,
    antivirus: true,
    compression: 'gzip',
  },
};

// Functions configuration
const APPWRITE_FUNCTIONS = {
  'agent': {
    name: 'Agent',
    runtime: 'node-22',
    entrypoint: 'index.js',
    commands: 'npm install',
    timeout: 300, // 5 minutes
    enabled: true,
    logging: true,
    execute: ['any'], // Allow any authenticated user to execute
    scopes: [
      'databases.read',
      'databases.write',
      'collections.read',
      'collections.write',
      'documents.read',
      'documents.write'
    ],
    variables: {
      'APPWRITE_ENDPOINT': APPWRITE_ENDPOINT,
      'APPWRITE_PROJECT_ID': APPWRITE_PROJECT_ID,
      'APPWRITE_DATABASE_ID': DATABASE_ID,
      'APPWRITE_FUNCTION_API_KEY': APPWRITE_API_KEY
    }
  }
};

// Utility functions
function log(message, type = 'info') {
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Database operations
async function ensureDatabase() {
  try {
    await databases.get(DATABASE_ID);
    log(`Database '${DATABASE_NAME}' already exists`, 'success');
  } catch (error) {
    if (error.code === 404) {
      log(`Creating database '${DATABASE_NAME}'...`, 'info');
      await databases.create(DATABASE_ID, DATABASE_NAME);
      log(`Database '${DATABASE_NAME}' created successfully`, 'success');
    } else {
      throw error;
    }
  }
}

async function ensureCollection(collectionId, config) {
  try {
    const collection = await databases.getCollection(DATABASE_ID, collectionId);
    log(`Collection '${config.name}' already exists`, 'success');
    return collection;
  } catch (error) {
    if (error.code === 404) {
      log(`Creating collection '${config.name}'...`, 'info');
      const collection = await databases.createCollection(
        DATABASE_ID,
        collectionId,
        config.name,
        config.permissions,
        true // documentSecurity: true
      );
      log(`Collection '${config.name}' created successfully`, 'success');
      return collection;
    } else {
      throw error;
    }
  }
}

async function ensureAttribute(collectionId, attribute) {
  try {
    await databases.getAttribute(DATABASE_ID, collectionId, attribute.key);
    log(`Attribute '${attribute.key}' already exists`, 'success');
  } catch (error) {
    if (error.code === 404) {
      log(`Creating attribute '${attribute.key}'...`, 'info');
      
      const createAttribute = async () => {
        switch (attribute.type) {
          case 'string':
            return databases.createStringAttribute(
              DATABASE_ID,
              collectionId,
              attribute.key,
              attribute.size,
              attribute.required,
              attribute.default,
              attribute.array
            );
          case 'integer':
            const intParams = {
              databaseId: DATABASE_ID,
              collectionId: collectionId,
              key: attribute.key,
              required: attribute.required,
              default: attribute.default,
              array: attribute.array
            };
            
            // Add min and max parameters if they exist
            if (attribute.min !== undefined) {
              intParams.min = attribute.min;
            }
            if (attribute.max !== undefined) {
              intParams.max = attribute.max;
            }
            
            return databases.createIntegerAttribute(intParams);
          case 'float':
            const floatParams = {
              databaseId: DATABASE_ID,
              collectionId: collectionId,
              key: attribute.key,
              required: attribute.required,
              default: attribute.default,
              array: attribute.array
            };
            
            // Add min and max parameters if they exist
            if (attribute.min !== undefined) {
              floatParams.min = attribute.min;
            }
            if (attribute.max !== undefined) {
              floatParams.max = attribute.max;
            }

            return databases.createFloatAttribute(floatParams);
          case 'boolean':
            return databases.createBooleanAttribute(
              DATABASE_ID,
              collectionId,
              attribute.key,
              attribute.required,
              attribute.default,
              attribute.array
            );
          case 'datetime':
            return databases.createDatetimeAttribute(
              DATABASE_ID,
              collectionId,
              attribute.key,
              attribute.required,
              attribute.default,
              attribute.array
            );
          default:
            throw new Error(`Unsupported attribute type: ${attribute.type}`);
        }
      };

      await createAttribute();
      log(`Attribute '${attribute.key}' created successfully`, 'success');
      
      // Wait for attribute to be ready
      await sleep(2000);
    } else {
      throw error;
    }
  }
}

async function ensureIndex(collectionId, index) {
  try {
    await databases.getIndex(DATABASE_ID, collectionId, index.key);
    log(`Index '${index.key}' already exists`, 'success');
  } catch (error) {
    if (error.code === 404) {
      log(`Creating index '${index.key}'...`, 'info');
      
      const createIndex = async () => {
        const indexParams = {
          databaseId: DATABASE_ID,
          collectionId: collectionId,
          key: index.key,
          type: index.type,
          attributes: index.attributes
        };
        
        // Add lengths parameter if specified
        if (index.lengths) {
          indexParams.lengths = index.lengths;
        }
        
        return databases.createIndex(indexParams);
      };

      await createIndex();
      log(`Index '${index.key}' created successfully`, 'success');
      
      // Wait for index to be ready
      await sleep(2000);
    } else {
      throw error;
    }
  }
}

async function ensureStorageBucket(bucketId, config) {
  try {
    await storage.getBucket(bucketId);
    log(`Storage bucket '${config.name}' already exists`, 'success');
  } catch (error) {
    if (error.code === 404) {
      log(`Creating storage bucket '${config.name}'...`, 'info');
      await storage.createBucket({
        bucketId: bucketId,
        name: config.name,
        permissions: config.permissions,
        fileSecurity: config.fileSecurity,
        allowedFileExtensions: config.allowedFileExtensions,
        maxFileSize: config.maxFileSize,
        encryption: config.encryption,
        antivirus: config.antivirus,
        compression: config.compression,
        enabled: true
      });
      log(`Storage bucket '${config.name}' created successfully`, 'success');
    } else {
      throw error;
    }
  }
}

async function ensureFunction(functionId, config) {
  try {
    const existingFunction = await functions.get(functionId);
    log(`Function '${config.name}' already exists`, 'success');
    return existingFunction;
  } catch (error) {
    if (error.code === 404) {
      log(`Creating function '${config.name}'...`, 'info');
      const newFunction = await functions.create({
        functionId: functionId,
        name: config.name,
        runtime: config.runtime,
        execute: config.execute,
        timeout: config.timeout,
        enabled: config.enabled,
        logging: config.logging,
        entrypoint: config.entrypoint,
        commands: config.commands,
        scopes: config.scopes
      });
      log(`Function '${config.name}' created successfully`, 'success');
      return newFunction;
    } else {
      throw error;
    }
  }
}

async function ensureFunctionVariables(functionId, variables) {
  for (const [key, value] of Object.entries(variables)) {
    try {
      // Check if variable exists
      const existingVariables = await functions.listVariables(functionId);
      const existingVar = existingVariables.variables.find(v => v.key === key);
      
      if (existingVar) {
        // Update existing variable
        await functions.updateVariable({
          functionId: functionId,
          variableId: existingVar.$id,
          key: key,
          value: value,
          secret: false
        });
        log(`Updated function variable '${key}'`, 'success');
      } else {
        // Create new variable
        await functions.createVariable({
          functionId: functionId,
          key: key,
          value: value,
          secret: false
        });
        log(`Created function variable '${key}'`, 'success');
      }
    } catch (error) {
      log(`Failed to set function variable '${key}': ${error.message}`, 'error');
    }
  }
}

async function deployFunction(functionId, functionPath) {
  try {
    log(`Checking deployments for function '${functionId}'...`, 'info');
    
    // Check if function already has deployments
    try {
      const existingDeployments = await functions.listDeployments(functionId);
      if (existingDeployments.deployments && existingDeployments.deployments.length > 0) {
        log(`Function '${functionId}' already has ${existingDeployments.deployments.length} deployment(s). Skipping deployment.`, 'success');
        return existingDeployments.deployments[0]; // Return the first deployment
      }
    } catch (listError) {
      if (listError.code === 404) {
        log(`Function '${functionId}' not found, will create it first`, 'info');
      } else {
        log(`Warning: Could not check existing deployments: ${listError.message}`, 'warning');
      }
    }
    
    log(`Deploying function '${functionId}' from ${functionPath}...`, 'info');
    
    // Check if function directory exists
    const { existsSync } = await import('fs');
    if (!existsSync(functionPath)) {
      throw new Error(`Function directory not found: ${functionPath}`);
    }
    
    // Check if required files exist
    const { join: pathJoin } = await import('path');
    const indexFile = pathJoin(functionPath, 'index.js');
    const packageFile = pathJoin(functionPath, 'package.json');
    
    if (!existsSync(indexFile)) {
      throw new Error(`Entry point file not found: ${indexFile}`);
    }
    
    if (!existsSync(packageFile)) {
      throw new Error(`Package file not found: ${packageFile}`);
    }
    
    // Read the files directly
    const indexContent = readFileSync(indexFile, 'utf8');
    const packageContent = readFileSync(packageFile, 'utf8');
    
    log(`Read function files: index.js (${indexContent.length} chars), package.json (${packageContent.length} chars)`, 'info');
    
    // Create TAR.GZ archive for deployment
    const { execSync } = await import('child_process');
    const { tmpdir } = await import('os');
    const { writeFileSync, unlinkSync, mkdirSync } = await import('fs');
    
    const tempDir = tmpdir();
    const tempFunctionDir = pathJoin(tempDir, `${functionId}-temp-${Date.now()}`);
    const tarPath = pathJoin(tempDir, `${functionId}-deployment-${Date.now()}.tar.gz`);
    
    try {
      // Install required tools for TAR.GZ creation
      log('Installing required tools for TAR.GZ creation...', 'info');
      execSync('apk add --no-cache tar gzip', { stdio: 'pipe' });
      log('Required tools installed successfully', 'info');
    } catch (installError) {
      log(`Tool installation failed: ${installError.message}`, 'info');
      log('Continuing with existing tools...', 'info');
    }

    // Create temp directory and copy files
    mkdirSync(tempFunctionDir, { recursive: true });
    writeFileSync(pathJoin(tempFunctionDir, 'index.js'), indexContent);
    writeFileSync(pathJoin(tempFunctionDir, 'package.json'), packageContent);
    
    // Verify files were copied correctly
    log(`Copied files to temp directory: ${tempFunctionDir}`, 'info');
    const { readdirSync } = await import('fs');
    log(`Temp directory contents: ${JSON.stringify(readdirSync(tempFunctionDir))}`, 'info');

    // Create tar.gz file (Appwrite Functions requires TAR.GZ)
    log(`Creating TAR.GZ archive: ${tarPath}`, 'info');
    execSync(`cd "${tempFunctionDir}" && tar -czf "${tarPath}" .`, { stdio: 'pipe' });
    
    if (!existsSync(tarPath)) {
      throw new Error('Tar.gz file was not created');
    }
    
    const deploymentBuffer = readFileSync(tarPath);
    log(`✅ Created tar.gz archive (${deploymentBuffer.length} bytes)`, 'info');
    log(`Tar.gz file exists and is readable: ${existsSync(tarPath)}`, 'info');
    
    // Cleanup temp files
    try {
      if (existsSync(tarPath)) unlinkSync(tarPath);
      execSync(`rm -rf "${tempFunctionDir}"`, { stdio: 'pipe' });
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    // Validate TAR.GZ archive
    const gzipSignature = deploymentBuffer.slice(0, 2).toString('hex');
    if (gzipSignature === '1f8b') {
      log(`✅ GZIP signature verified: ${gzipSignature}`, 'info');
    } else {
      log(`❌ Invalid GZIP signature: ${gzipSignature}`, 'error');
      throw new Error('Invalid TAR.GZ archive created');
    }
    
    log(`Final archive size: ${deploymentBuffer.length} bytes`, 'info');
    
    // Deploy the function
    const deploymentId = 'main';
    log(`Deploying function with ID: ${deploymentId}`, 'info');
    
    // Convert Buffer to File/Blob like in storage.ts
    const deploymentFile = new File([deploymentBuffer], `${functionId}-deployment.tar.gz`, {
      type: 'application/gzip'
    });
    
    const deployment = await functions.createDeployment({
      functionId: functionId,
      code: deploymentFile,
      activate: true
    });
    
    log(`✅ Deployment successful with ID: ${deploymentId}`, 'success');
    
    log(`Function '${functionId}' deployed successfully with ID: ${deployment.$id}`, 'success');
    return deployment;
    
  } catch (error) {
    log(`Failed to deploy function '${functionId}': ${error.message}`, 'error');
    log(`Error details: ${error.stack}`, 'error');
    throw error;
  }
}

// Main setup function
async function setupAppwrite() {
  try {
    log('🚀 Starting Appwrite database setup...', 'info');
    
    // Ensure database exists
    await ensureDatabase();
    
    // Setup collections
    for (const [collectionId, config] of Object.entries(COLLECTIONS)) {
      log(`\n📁 Setting up collection '${collectionId}'...`, 'info');
      
      // Create collection
      await ensureCollection(collectionId, config);
      
      // Create attributes
      for (const attribute of config.attributes) {
        await ensureAttribute(collectionId, attribute);
      }
      
      // Create indexes
      for (const index of config.indexes) {
        await ensureIndex(collectionId, index);
      }
    }
    
    // Setup storage buckets
    log('\n🗄️ Setting up storage buckets...', 'info');
    for (const [bucketId, config] of Object.entries(STORAGE_BUCKETS)) {
      await ensureStorageBucket(bucketId, config);
    }
    
    // Setup functions
    log('\n⚡ Setting up functions...', 'info');
    for (const [functionId, config] of Object.entries(APPWRITE_FUNCTIONS)) {
      log(`\n📦 Setting up function '${functionId}'...`, 'info');
      
      // Create function
      await ensureFunction(functionId, config);
      
      // Set function variables
      if (config.variables) {
        await ensureFunctionVariables(functionId, config.variables);
      }
      
      // Deploy function (only if no existing deployments)
      const functionPath = join(process.cwd(), 'functions', functionId);
      try {
        const deployment = await deployFunction(functionId, functionPath);
        if (deployment) {
          log(`Function '${functionId}' deployment status: ${deployment.$id}`, 'success');
        }
      } catch (deployError) {
        log(`Warning: Could not deploy function '${functionId}': ${deployError.message}`, 'warning');
        log(`You can manually deploy the function from the Appwrite Console`, 'info');
      }
    }
    
    log('\n🎉 Appwrite setup completed successfully!', 'success');
    log('\n📋 Setup Summary:', 'info');
    log(`   • Database: ${DATABASE_NAME}`, 'info');
    log(`   • Collections: ${Object.keys(COLLECTIONS).length}`, 'info');
    log(`   • Storage Buckets: ${Object.keys(STORAGE_BUCKETS).length}`, 'info');
    log(`   • Functions: ${Object.keys(APPWRITE_FUNCTIONS).length}`, 'info');
    
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAppwrite();
}

export { setupAppwrite };
