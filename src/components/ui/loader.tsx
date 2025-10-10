import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";
import { useEffect, useState } from "react";

interface FullscreenLoaderProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export function FullscreenLoader({ isVisible, onComplete }: FullscreenLoaderProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  // Array of different welcome messages
  const welcomeMessages = [
    "Welcome back",
    "Ready to create?",
    "Let's write something amazing",
    "Time to craft great content",
    "Your ideas await",
    "Ready to collaborate?",
    "Let's build something together",
    "Welcome to your workspace",
    "Ready to get started?",
    "Time to create magic",
    "Let's make it happen",
    "Your creativity awaits",
    "Ready to inspire?",
    "Let's tell great stories",
    "Time to shine",
    "Ready to innovate?",
    "Let's create something special",
    "Your voice matters",
    "Ready to make an impact?",
    "Let's bring ideas to life",
    "Time to express yourself",
    "Ready to explore?",
    "Let's craft perfection",
    "Your story begins here",
    "Ready to connect?",
    "Let's make it memorable",
    "Time to be brilliant",
    "Ready to transform?",
    "Let's write the future",
    "Your journey continues",
    "Ready to discover?",
    "Let's create together",
    "Time to be extraordinary",
    "Ready to inspire others?",
    "Let's make it count"
  ];

  // Set a random welcome message when component mounts
  useEffect(() => {
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    setWelcomeMessage(randomMessage);
  }, []);

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
          className="fixed inset-0 z-50 bg-background loader-container"
        >
          {/* Centered Welcome Message */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-center"
            >
              <div className="text-base font-normal text-muted-foreground">
                {welcomeMessage}
              </div>
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
