# Appwrite Database Setup Script

This script automatically sets up your Appwrite database structure, including collections, attributes, indexes, and storage buckets. It's designed to be run as part of your deployment process and will only create missing resources.

## Features

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Incremental**: Only creates missing resources
- ✅ **Comprehensive**: Sets up databases, collections, attributes, indexes, and storage
- ✅ **Error Handling**: Graceful error handling with detailed logging
- ✅ **Environment Aware**: Supports different environments (dev/prod)

## Prerequisites

1. **Appwrite API Key**: You need an API key with admin permissions
2. **Environment Variables**: Set up your Appwrite configuration
3. **Dependencies**: Install required packages

## Setup

### 1. Install Dependencies

```bash
npm install
```

The script uses the `node-appwrite` package for server-side operations with API keys.

### 2. Environment Configuration

Create a `.env` file in your project root:

```bash
# Appwrite Configuration (ALL REQUIRED - NO FALLBACKS)
APPWRITE_ENDPOINT=https://stage.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id-here
APPWRITE_API_KEY=your-api-key-here
APPWRITE_DATABASE_ID=your-database-id-here

# For production, use:
# APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
# APPWRITE_PROJECT_ID=your-production-project-id
# APPWRITE_API_KEY=your-production-api-key
```

### 3. Get Your API Key

1. Go to your Appwrite Console
2. Navigate to Settings → API Keys
3. Create a new API key with the following scopes:
   - `databases.read`
   - `databases.write`
   - `collections.read`
   - `collections.write`
   - `attributes.read`
   - `attributes.write`
   - `indexes.read`
   - `indexes.write`
   - `storage.read`
   - `storage.write`

## Usage

### Run Setup Script

```bash
# Run the setup script
npm run setup:appwrite

# Or run with node directly
node scripts/setup-appwrite.js
```

### Deploy with Setup

```bash
# Run setup and build together
npm run deploy
```

## What Gets Created

### Database
- **Database ID**: Set via `APPWRITE_DATABASE_ID` environment variable
- **Name**: "Imagine Project Database"

### Collections

#### Articles Collection
- **ID**: `articles`
- **Attributes**: createdBy, title, slug, excerpt, coverImageId, published, publishedAt, pinned
- **Indexes**: createdBy, published, pinned, publishedAt, slug (unique)

#### Article Sections Collection
- **ID**: `article_sections`
- **Attributes**: createdBy, articleId, type, position, content, mediaId, embedUrl, data, caption, speaker
- **Indexes**: createdBy, articleId, type, position, articleId_position (composite)

### Storage
- **Bucket ID**: `media-bucket`
- **File Types**: Images, videos, documents
- **Security**: Encryption, antivirus scanning, file size limits

## Script Behavior

The script is designed to be **idempotent** and **safe**:

1. **Checks for existence** before creating resources
2. **Only creates missing** attributes, indexes, or collections
3. **Preserves existing** data and configurations
4. **Handles errors gracefully** with detailed logging
5. **Waits for resources** to be ready before proceeding

## Error Handling

The script includes comprehensive error handling:

- ✅ **404 errors**: Resource doesn't exist, will create it
- ✅ **Permission errors**: Clear error messages
- ✅ **Network errors**: Retry logic and timeouts
- ✅ **Validation errors**: Detailed error descriptions

## Logging

The script provides detailed logging:

- ℹ️ **Info**: General information about operations
- ✅ **Success**: Successful operations
- ⚠️ **Warning**: Non-critical issues
- ❌ **Error**: Critical errors that stop execution

## Integration with CI/CD

You can integrate this script into your deployment pipeline:

```yaml
# Example GitHub Actions workflow
- name: Setup Appwrite Database
  run: npm run setup:appwrite
  env:
    APPWRITE_ENDPOINT: ${{ secrets.APPWRITE_ENDPOINT }}
    APPWRITE_PROJECT_ID: ${{ secrets.APPWRITE_PROJECT_ID }}
    APPWRITE_API_KEY: ${{ secrets.APPWRITE_API_KEY }}
```

## Troubleshooting

### Common Issues

1. **API Key Permissions**: Ensure your API key has all required scopes
2. **Project ID**: Verify the project ID is correct
3. **Endpoint**: Make sure you're using the correct Appwrite endpoint
4. **Network**: Check your internet connection and firewall settings

### Debug Mode

For detailed debugging, you can modify the script to include more verbose logging or run it with debug flags.

## Customization

To modify the database structure:

1. Edit the `COLLECTIONS` configuration in `setup-appwrite.ts`
2. Add or modify attributes, indexes, or permissions
3. Run the script to apply changes

The script will automatically detect and create any new resources while preserving existing ones.
