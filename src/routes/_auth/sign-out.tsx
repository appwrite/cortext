import { useAuth } from '@/hooks/use-auth';
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react';

export const Route = createFileRoute('/_auth/sign-out')({
  component: RouteComponent,
})

function RouteComponent() {
  const { signOut } = useAuth();

  useEffect(() => {
    signOut.mutate();
  }, []);

  return null;
}
