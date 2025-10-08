import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UnpublishedChangesBannerProps {
  onSave?: () => void
  isSaving?: boolean
}

export function UnpublishedChangesBanner({ onSave, isSaving = false }: UnpublishedChangesBannerProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-md px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm text-blue-800 dark:text-blue-200">
            You have unpublished changes. Deploy to update the article.
          </span>
        </div>
        {onSave && (
          <Button
            size="sm"
            variant="default"
            onClick={onSave}
            disabled={isSaving}
            className="ml-3 h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
          >
            {isSaving ? 'Deploying...' : 'Deploy'}
          </Button>
        )}
      </div>
    </div>
  )
}
