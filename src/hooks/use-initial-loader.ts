import { useEffect, useState } from "react";
import { useRouter, useLocation } from "@tanstack/react-router";

export function useInitialLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  const location = useLocation();

  useEffect(() => {
    // Only show loader for protected routes (content pages), not the main landing page
    const isProtectedRoute = location.pathname.startsWith('/content');
    
    if (isProtectedRoute) {
      // Show loader for content pages on every navigation
      const minLoadTime = 800; // 800ms minimum
      const startTime = Date.now();
      
      // Set loading to true for protected routes
      setIsLoading(true);
      
      const handleLoadComplete = () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);
        
        setTimeout(() => {
          setIsLoading(false);
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
    }
  }, [router, location.pathname]);

  // Separate effect for initial load state
  useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => setIsInitialLoad(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  return {
    isLoading: isLoading, // Show loader on every navigation to protected routes
    isInitialLoad,
  };
}
