import { Brain, Sparkles, FileText, Search, Lightbulb, CheckCircle } from 'lucide-react'

interface ConversationPlaceholderProps {
  onSendMessage?: (message: string) => void
}

export function ConversationPlaceholder({ onSendMessage }: ConversationPlaceholderProps) {
  const capabilities = [
    {
      icon: <Sparkles className="h-4 w-4" />,
      title: "SEO Optimization",
      description: "SEO titles & descriptions"
    },
    {
      icon: <FileText className="h-4 w-4" />,
      title: "Content Enhancement",
      description: "Improve writing & headlines"
    },
    {
      icon: <Search className="h-4 w-4" />,
      title: "Research Assistance",
      description: "Topic research & structure"
    },
    {
      icon: <CheckCircle className="h-4 w-4" />,
      title: "Fact Checking",
      description: "Verify claims & accuracy"
    },
    {
      icon: <Lightbulb className="h-4 w-4" />,
      title: "Creative Ideas",
      description: "New angles & approaches"
    }
  ]

  return (
    <div className="px-6 py-6 space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-2 rounded-full bg-accent">
            <Brain className="h-5 w-5 text-accent-foreground" />
          </div>
        </div>
        <h3 className="text-base font-semibold text-foreground">Agent Cortext</h3>
        <p className="text-xs text-muted-foreground">
          Your intelligent co-writer ready to help create amazing content.
        </p>
      </div>

      {/* Capabilities */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">What I can help with:</h4>
        <div className="space-y-2">
          {capabilities.map((capability, index) => (
            <div key={index} className="flex items-start gap-2 p-3 rounded bg-muted/50">
              <div className="text-muted-foreground mt-0.5">
                {capability.icon}
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-medium text-foreground">
                  {capability.title}
                </h5>
                <p className="text-xs text-muted-foreground">
                  {capability.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
