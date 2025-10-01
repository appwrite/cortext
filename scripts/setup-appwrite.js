#!/usr/bin/env node

const sdk = require('node-appwrite');
const { readFileSync } = require('fs');
const { join } = require('path');

const { Client, Databases, Storage, ID, Permission, Role, Query } = sdk;

// Configuration
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://stage.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '68af6eea000565837b93';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

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
      { key: 'createdBy', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'title', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'slug', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'excerpt', type: 'string', size: 1000, required: false, array: false, default: null },
      { key: 'coverImageId', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'published', type: 'boolean', required: true, array: false, default: false },
      { key: 'publishedAt', type: 'integer', required: false, array: false, default: null },
      { key: 'pinned', type: 'boolean', required: true, array: false, default: false },
    ],
    indexes: [
      { key: 'createdBy', type: 'key', attributes: ['createdBy'] },
      { key: 'published', type: 'key', attributes: ['published'] },
      { key: 'pinned', type: 'key', attributes: ['pinned'] },
      { key: 'publishedAt', type: 'key', attributes: ['publishedAt'] },
      { key: 'slug', type: 'unique', attributes: ['slug'] },
    ],
  },
  article_sections: {
    name: 'Article Sections',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.user()),
      Permission.update(Role.user()),
      Permission.delete(Role.user()),
    ],
    attributes: [
      { key: 'createdBy', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'articleId', type: 'string', size: 255, required: true, array: false, default: null },
      { key: 'type', type: 'string', size: 50, required: true, array: false, default: 'text' },
      { key: 'position', type: 'integer', required: true, array: false, default: 0 },
      { key: 'content', type: 'string', size: 10000, required: false, array: false, default: null },
      { key: 'mediaId', type: 'string', size: 255, required: false, array: false, default: null },
      { key: 'embedUrl', type: 'string', size: 500, required: false, array: false, default: null },
      { key: 'data', type: 'string', size: 5000, required: false, array: false, default: null },
      { key: 'caption', type: 'string', size: 500, required: false, array: false, default: null },
      { key: 'speaker', type: 'string', size: 255, required: false, array: false, default: null },
    ],
    indexes: [
      { key: 'createdBy', type: 'key', attributes: ['createdBy'] },
      { key: 'articleId', type: 'key', attributes: ['articleId'] },
      { key: 'type', type: 'key', attributes: ['type'] },
      { key: 'position', type: 'key', attributes: ['position'] },
      { key: 'articleId_position', type: 'key', attributes: ['articleId', 'position'] },
    ],
  },
};

// Storage configuration
const STORAGE_BUCKETS = {
  'media-bucket': {
    name: 'Media Bucket',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.user()),
      Permission.update(Role.user()),
      Permission.delete(Role.user()),
    ],
    fileSecurity: true,
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'mov', 'avi', 'mkv', 'pdf', 'doc', 'docx', 'txt', 'md'],
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
        switch (index.type) {
          case 'key':
            return databases.createIndex(
              DATABASE_ID,
              collectionId,
              index.key,
              index.type,
              index.attributes
            );
          case 'unique':
            return databases.createIndex(
              DATABASE_ID,
              collectionId,
              index.key,
              index.type,
              index.attributes
            );
          default:
            throw new Error(`Unsupported index type: ${index.type}`);
        }
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
      await storage.createBucket(
        bucketId,
        config.name,
        config.permissions,
        config.fileSecurity,
        config.allowedFileExtensions,
        config.maxFileSize,
        config.encryption,
        config.antivirus,
        config.compression
      );
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
if (require.main === module) {
  setupAppwrite();
}

module.exports = { setupAppwrite };
