import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { getAccountClient } from "@/lib/appwrite";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";

export const Route = createFileRoute("/verify-email")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      userId: search.userId as string,
      secret: search.secret as string,
    };
  },
});

type VerificationStatus = 'verifying' | 'success' | 'error';

function RouteComponent() {
  const navigate = useNavigate();
  const { userId, secret } = useSearch({ from: "/verify-email" });
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useDocumentTitle('Verify Email');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!userId || !secret) {
        setStatus('error');
        setErrorMessage('Missing verification parameters');
        return;
      }

      try {
        const account = getAccountClient();
        await account.updateVerification(userId, secret);
        setStatus('success');
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.message || 'Verification failed');
      }
    };

    verifyEmail();
  }, [userId, secret]);

  const handleContinue = () => {
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <AuthCard
        title="Email Verification"
        description="Verifying your email address"
      >
        <div className="flex flex-col items-center space-y-4 py-8">
          {status === 'verifying' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Verifying your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                  Email Verified Successfully!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your email address has been verified. You can now access all features.
                </p>
              </div>
              <Button onClick={handleContinue} className="w-full">
                Continue to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                  Verification Failed
                </h3>
                <p className="text-sm text-muted-foreground">
                  {errorMessage}
                </p>
              </div>
              <Button onClick={handleContinue} variant="outline" className="w-full">
                Return to Home
              </Button>
            </>
          )}
        </div>
      </AuthCard>
    </div>
  );
}