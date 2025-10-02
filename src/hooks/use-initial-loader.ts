import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";

export function useInitialLoader() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if this is the initial page load
    const isInitialPageLoad = !sessionStorage.getItem("hasLoadedBefore");
    
    if (isInitialPageLoad) {
      // Mark that we've loaded before
      sessionStorage.setItem("hasLoadedBefore", "true");
      
      // Show loader for a minimum time to prevent flash
      const minLoadTime = 1000; // 1 second minimum
      const startTime = Date.now();
      
      const handleLoadComplete = () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);
        
        setTimeout(() => {
          setIsLoading(false);
          // Mark initial load as complete after a short delay
          setTimeout(() => setIsInitialLoad(false), 500);
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
      // Not initial load, don't show loader
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [router]);

  return {
    isLoading: isLoading && isInitialLoad,
    isInitialLoad,
  };
}
