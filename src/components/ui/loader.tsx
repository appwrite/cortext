import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Brain } from "lucide-react";
import { useEffect, useState } from "react";

interface FullscreenLoaderProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export function FullscreenLoader({ isVisible, onComplete }: FullscreenLoaderProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      // Delay unmounting to allow fade-out animation to complete
      const timer = setTimeout(() => {
        setShouldRender(false);
        onComplete?.();
      }, 500); // Match the exit animation duration
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Centered Loading Spinner */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </motion.div>
          </div>

          {/* Bottom Header - Icon and Text */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="font-semibold tracking-tight inline-flex items-center gap-2 text-foreground">
              <Brain className="h-5 w-5 text-primary" />
              Cortext
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
