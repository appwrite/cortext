# Cortext

AI powered content management system built with React, TypeScript, and Appwrite.

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Appwrite instance

### Environment Setup

1. Copy `env.template` to `.env` and fill in your Appwrite credentials:
   ```bash
   cp env.template .env
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production (includes Appwrite setup)
- `pnpm setup:appwrite` - Run Appwrite database setup only
- `pnpm deploy` - Build and deploy (same as build)
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint

### Database Setup

The build process automatically sets up the required Appwrite collections:
- Articles
- Authors  
- Categories
- Images
- **Notifications** (new!)

If you need to run the database setup manually:
```bash
pnpm setup:appwrite
```

## Features

- Article management with rich text editor
- Image gallery and management
- Author and category management
- Real-time notifications system
- Responsive design
- TypeScript support
