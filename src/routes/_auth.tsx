import { getAccountClient } from "@/lib/appwrite";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppwriteException } from "appwrite";

// src/routes/_authenticated.tsx
export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/sign-out") {
      return;
    }

    const account = getAccountClient();

    let user: Awaited<ReturnType<typeof account.get>> | null = null;

    try {
      user = await account.get();
      if (user) {
        throw redirect({
          to: "/",
        });
      }
    } catch (error) {
      if (error instanceof AppwriteException) {
        if (error.code !== 401) {
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
});
