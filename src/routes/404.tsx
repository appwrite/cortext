import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Brain, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'

export const Route = createFileRoute('/404')({
  component: NotFoundComponent,
})

function NotFoundComponent() {
  // Set document title for 404 page
  useDocumentTitle('Page Not Found')

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
          {/* Error Code */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-4xl font-light text-muted-foreground/20 mb-2"
          >
            404
          </motion.div>
          
          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="space-y-3"
          >
            <h1 className="text-lg font-light text-foreground">
              Page not found
            </h1>
            <p className="text-xs text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
              <Button asChild variant="default" size="sm" className="inline-flex items-center gap-2">
                <Link to="/">
                  <Home className="h-4 w-4" />
              Go Home
            </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="inline-flex items-center gap-2">
                <Link to="/content">
                  <ArrowLeft className="h-4 w-4" />
              Back to Content
            </Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Header - Icon and Text */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="font-semibold tracking-tight inline-flex items-center gap-2 text-sm text-foreground">
          <Brain className="h-4 w-4 text-primary" />
          Cortext
        </div>
      </div>
    </motion.div>
  )
}
