import { Button } from '@/components/ui/button'
import { History } from 'lucide-react'
import { formatDateRelative } from '@/lib/date-utils'

interface RevertConfirmationBannerProps {
  revisionTitle: string
  revisionDate: string
  onConfirm: () => void
  onCancel: () => void
  isReverting?: boolean
}

export function RevertConfirmationBanner({
  revisionTitle,
  revisionDate,
  onConfirm,
  onCancel,
  isReverting = false
}: RevertConfirmationBannerProps) {
  return (
    <div className="bg-red-50/90 dark:bg-red-950/50 backdrop-blur-sm rounded-lg px-4 py-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <History className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm min-w-0 flex-1">
            <span className="text-red-800 dark:text-red-200 font-semibold">
              Reverting to revision:
            </span>
            <div className="text-red-700 dark:text-red-300 text-xs mt-1 font-medium truncate">
              {revisionTitle} • {formatDateRelative(revisionDate)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-center">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={isReverting}
            className="h-8 px-4 text-sm text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onConfirm}
            disabled={isReverting}
            className="h-8 px-4 text-sm bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
          >
            {isReverting ? 'Reverting...' : 'Revert'}
          </Button>
        </div>
      </div>
    </div>
  )
}