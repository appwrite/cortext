/// <reference types="vite/client" />

// Register the router instance for type safety
import { router } from './main'
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}