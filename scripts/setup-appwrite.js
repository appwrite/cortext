#!/usr/bin/env node

import { Client, Databases, Storage, ID, Permission, Role, Query } from 'node-appwrite';
import { readFileSync } from 'fs';
import { join } from 'path';

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

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

// Database configuration
const DATABASE_ID = 'imagine-project-db';
const DATABASE_NAME = 'Imagine Project Database';

// Collections configuration
const COLLECTIONS = {
  articles: {
    name: 'Articles',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.user()),
      Permission.update(Role.user()),
      Permission.delete(Role.user()),
    ],
    attributes: [
      { key: 'trailer', type: 'string', size: 512, required: false, array: false, default: null },
      { key: 'title', type: 'string', size: 1024, required: false, array: false, default: null },
      { key: 'status', type: 'string', size: 50, required: false, array: false, default: 'unpublished' },
      { key: 'subtitle', type: 'string', size: 2048, required: false, array: false, default: null },
      { key: 'images', type: 'string', size: 512, required: false, array: true, default: null },
      { key: 'body', type: 'string', size: 200000, required: false, array: false, default: null },
      { key: 'authors', type: 'string', size: 512, required: false, array: true, default: null },
      { key: 'live', type: 'boolean', required: false, array: false, default: false },
      { key: 'pinned', type: 'boolean', required: false, array: false, default: false },
      { key: 'redirect', type: 'string', size: 500, required: false, array: false, default: null },
      { key: 'categories', type: 'string', size: 512, required: false, array: true, default: null },
    ],
    indexes: [
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'live', type: 'key', attributes: ['live'] },
      { key: 'pinned', type: 'key', attributes: ['pinned'] },
      { key: 'title', type: 'key', attributes: ['title'], lengths: [191] },
      // Note: subtitle, body are large fields (2048+ chars) - if indexed in future, use lengths: [191]
    ],
  },
  authors: {
    name: 'Authors',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.user()),
      Permission.update(Role.user()),
      Permission.delete(Role.user()),
    ],
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
    ],
    indexes: [
      { key: 'firstname', type: 'key', attributes: ['firstname'] },
      { key: 'lastname', type: 'key', attributes: ['lastname'] },
      { key: 'email', type: 'unique', attributes: ['email'] },
      // Note: biography is large field (2048 chars) - if indexed in future, use lengths: [191]
    ],
  },
  categories: {
    name: 'Categories',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.user()),
      Permission.update(Role.user()),
      Permission.delete(Role.user()),
    ],
    attributes: [
      { key: 'name', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'slug', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'description', type: 'string', size: 2048, required: false, array: false, default: null },
    ],
    indexes: [
      { key: 'name', type: 'key', attributes: ['name'] },
      { key: 'slug', type: 'unique', attributes: ['slug'] },
      // Note: description is large field (2048 chars) - if indexed in future, use lengths: [191]
    ],
  },
  images: {
    name: 'Images',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.user()),
      Permission.update(Role.user()),
      Permission.delete(Role.user()),
    ],
    attributes: [
      { key: 'file', type: 'string', size: 256, required: true, array: false, default: null },
      { key: 'caption', type: 'string', size: 2048, required: false, array: false, default: null },
      { key: 'credits', type: 'string', size: 256, required: false, array: false, default: null },
    ],
    indexes: [
      { key: 'file', type: 'key', attributes: ['file'] },
      // Note: caption is large field (2048 chars) - if indexed in future, use lengths: [191]
    ],
  },
};

// Storage configuration
const STORAGE_BUCKETS = {
  'images': {
    name: 'Images',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.user()),
      Permission.update(Role.user()),
      Permission.delete(Role.user()),
    ],
    fileSecurity: true,
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'],
    maxFileSize: 10485760, // 10MB
    encryption: true,
    antivirus: true,
    compression: 'gzip',
  },
};

// Utility functions
function log(message, type = 'info') {
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  console.log(`${icons[type]} ${message}`);
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
        config.permissions
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
            return databases.createIntegerAttribute(
              DATABASE_ID,
              collectionId,
              attribute.key,
              attribute.required,
              attribute.default,
              attribute.array
            );
          case 'boolean':
            return databases.createBooleanAttribute(
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
    
    log('\n🎉 Appwrite database setup completed successfully!', 'success');
    
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
