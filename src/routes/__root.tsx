import { RouterContext } from "@/main";
import { createRootRouteWithContext, Outlet, ErrorComponent } from "@tanstack/react-router";
import { FullscreenLoader } from "@/components/ui/loader";
import { useInitialLoader } from "@/hooks/use-initial-loader";
import { motion } from "framer-motion";
import { Brain, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useDocumentTitle } from "@/hooks/use-document-title";

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
  },
  component: () => {
    const { isLoading } = useInitialLoader();
    
    return (
      <>
        <FullscreenLoader isVisible={isLoading} />
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </>
    );
  },
  errorComponent: AppErrorComponent,
});

function AppErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  // Set document title for error page
  useDocumentTitle('Error')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-50 bg-background error-container"
    >
      {/* Centered Error Message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center max-w-md mx-auto px-6"
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-3xl mb-2 text-destructive"
          >
            ⚠️
          </motion.div>
          
          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="space-y-2"
          >
            <h1 className="text-lg font-light text-foreground">
              Something went wrong
            </h1>
            <p className="text-xs text-muted-foreground">
              An unexpected error occurred. Please try again or go back to the home page.
            </p>
            
            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-3 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Error Details
                </summary>
                <pre className="mt-1 text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
              <Button onClick={reset} size="sm" className="inline-flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button asChild variant="outline" size="sm" className="inline-flex items-center gap-2">
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Header - Icon and Text */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="font-light tracking-tight inline-flex items-center gap-2 text-sm text-foreground">
          <Brain className="h-4 w-4 text-primary" />
          Cortext
        </div>
      </div>
    </motion.div>
  );
}
