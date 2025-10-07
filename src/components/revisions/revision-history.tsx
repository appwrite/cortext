import { useRevisionHistory } from '@/hooks/use-revisions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, User, FileText, Code, Image, Quote, Type } from 'lucide-react'

interface RevisionHistoryProps {
  articleId: string
}

export function RevisionHistory({ articleId }: RevisionHistoryProps) {
  const { revisionHistory, isLoading, error } = useRevisionHistory(articleId)

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading revision history...</div>
  if (error) return <div className="text-sm text-red-500">Error loading revisions</div>

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-3 w-3" />
      case 'title': return <FileText className="h-3 w-3" />
      case 'code': return <Code className="h-3 w-3" />
      case 'image': return <Image className="h-3 w-3" />
      case 'quote': return <Quote className="h-3 w-3" />
      default: return <FileText className="h-3 w-3" />
    }
  }

  const formatChange = (change: string) => {
    // Format the change description for better readability
    if (change.includes('Updated')) {
      const [action, field, values] = change.split(': ')
      const [oldValue, newValue] = values?.split(' → ') || ['', '']
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {field}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {oldValue} → {newValue}
          </span>
        </div>
      )
    }
    
    if (change.includes('Section')) {
      const [sectionInfo, action] = change.split(': ')
      const [sectionId, sectionAction] = sectionInfo.split(' ')
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {sectionAction}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Section {sectionId}
          </span>
        </div>
      )
    }
    
    return <span className="text-xs">{change}</span>
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Revision History</h3>
      
      {revisionHistory.length === 0 ? (
        <div className="text-sm text-muted-foreground">No revisions yet</div>
      ) : (
        <div className="space-y-3">
          {revisionHistory.map((revision) => (
            <Card key={revision.$id} className="text-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Version {revision.version}
                    {revision.isInitial && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Initial
                      </Badge>
                    )}
                    {revision.isPublished && (
                      <Badge variant="default" className="ml-2 text-xs bg-green-600">
                        Published
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(revision.timestamp).toLocaleString()}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {/* Show changed attributes */}
                  {Object.keys(revision.changedAttributes).length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">
                        Changed Attributes:
                      </h4>
                      <div className="space-y-1">
                        {Object.entries(revision.changedAttributes).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {key}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show section changes */}
                  {revision.sectionChanges.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">
                        Section Changes:
                      </h4>
                      <div className="space-y-1">
                        {revision.sectionChanges.map((change: any, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            {getSectionIcon(change.type)}
                            <Badge 
                              variant={change.action === 'create' ? 'default' : change.action === 'delete' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {change.action}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {change.id}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show change descriptions */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">
                      Changes:
                    </h4>
                    <div className="space-y-1">
                      {revision.changes.map((change, index) => (
                        <div key={index}>
                          {formatChange(change)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
