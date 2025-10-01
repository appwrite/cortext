import { getAccountClient } from '@/lib/appwrite'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppwriteException } from 'appwrite';

// src/routes/_authenticated.tsx
export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const account = getAccountClient();

    try {
      await account.get();
    } catch (error) {
      if (error instanceof AppwriteException) {
        if (error.code === 401) {
          throw redirect({
            to: '/sign-in',
            search: {
              redirect: location.href,
            }
          })
        }
      }
    }
  },
})