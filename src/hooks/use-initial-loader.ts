import { useEffect, useState } from "react";
import { useRouter, useLocation } from "@tanstack/react-router";

export function useInitialLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  const location = useLocation();

  useEffect(() => {
    // Only show loader for protected routes (dashboard pages), not the main landing page
    const isProtectedRoute = location.pathname.startsWith('/dashboard');
    
    if (isProtectedRoute) {
      // Show loader for dashboard pages on every navigation
      const minLoadTime = 800; // 800ms minimum
      const startTime = Date.now();
      
      // Set loading to true for protected routes
      setIsLoading(true);
      
      const handleLoadComplete = () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);
        
        setTimeout(() => {
          setIsLoading(false);
          // Mark initial load as complete after a short delay (only on first load)
          if (isInitialLoad) {
            setTimeout(() => setIsInitialLoad(false), 300);
          }
        }, remainingTime);
      };

      // Listen for router ready state
      if (router.state.status === "idle") {
        handleLoadComplete();
      } else {
        const unsubscribe = router.subscribe("onLoad", () => {
          handleLoadComplete();
          unsubscribe();
        });
      }
    } else {
      // Not a protected route, don't show loader
      setIsLoading(false);
      // Only set initial load to false on first load
      if (isInitialLoad) {
        setTimeout(() => setIsInitialLoad(false), 300);
      }
    }
  }, [router, location.pathname, isInitialLoad]);

  return {
    isLoading: isLoading, // Show loader on every navigation to protected routes
    isInitialLoad,
  };
}
