import { useEffect, useState } from "react";
import { useRouter, useLocation } from "@tanstack/react-router";

export function useInitialLoader() {
  const [isLoading, setIsLoading] = useState(false); // Start as false
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  const location = useLocation();

  useEffect(() => {
    // Only show loader for protected routes (dashboard pages), not the main landing page
    const isProtectedRoute = location.pathname.startsWith('/dashboard');
    
    if (isProtectedRoute) {
      // Show loader for dashboard pages
      const minLoadTime = 800; // 800ms minimum
      const startTime = Date.now();
      
      // Set loading to true for protected routes
      setIsLoading(true);
      
      const handleLoadComplete = () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);
        
        setTimeout(() => {
          setIsLoading(false);
          // Mark initial load as complete after a short delay
          setTimeout(() => setIsInitialLoad(false), 300);
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
      setIsInitialLoad(false);
    }
  }, [router, location.pathname]);

  return {
    isLoading: isLoading && isInitialLoad,
    isInitialLoad,
  };
}
