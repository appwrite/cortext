import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UnpublishedChangesBannerProps {
  onSave?: () => void
  isSaving?: boolean
}

export function UnpublishedChangesBanner({ onSave, isSaving = false }: UnpublishedChangesBannerProps) {
  return (
    <div className="bg-blue-50/90 dark:bg-blue-950/50 backdrop-blur-sm rounded-lg px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            You have unpublished changes. Deploy to update the article.
          </span>
        </div>
        {onSave && (
          <Button
            size="sm"
            variant="default"
            onClick={onSave}
            disabled={isSaving}
            className="ml-3 h-8 px-4 text-sm bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
          >
            {isSaving ? 'Deploying...' : 'Deploy'}
          </Button>
        )}
      </div>
    </div>
  )
}
