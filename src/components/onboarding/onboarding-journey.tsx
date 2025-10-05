import { useState, useEffect } from 'react'
import { Check, Plus, Users, Palette, ArrowRight, Share2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAccountClient } from '@/lib/appwrite'
import { toast } from '@/hooks/use-toast'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  completed: boolean
  action?: () => void
}

interface OnboardingPreferences {
  onboardingCompletedSteps?: string[]
  onboardingDismissed?: boolean
}

interface OnboardingJourneyProps {
  onComplete?: () => void
  onCreateArticle?: () => void
  onChooseTemplate?: () => void
  onInviteTeam?: () => void
  onShareOnX?: () => void
  articleCount?: number
}

export function OnboardingJourney({ 
  onComplete, 
  onCreateArticle, 
  onChooseTemplate, 
  onInviteTeam,
  onShareOnX,
  articleCount = 0
}: OnboardingJourneyProps) {
  const account = getAccountClient()
  const queryClient = useQueryClient()

  // Query user preferences
  const { data: userPrefs } = useQuery({
    queryKey: ['auth', 'preferences'],
    queryFn: () => account.getPrefs(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const onboardingPrefs = userPrefs as OnboardingPreferences || {}
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'create-article',
      title: 'Create your first article',
      description: 'Start by creating a new article to get familiar with the editor',
      icon: Plus,
      completed: false,
    },
    {
      id: 'choose-template',
      title: 'Choose a template',
      description: 'Select a template that matches your content style',
      icon: Palette,
      completed: false,
    },
    {
      id: 'invite-team',
      title: 'Invite team members',
      description: 'Collaborate with your team by inviting them to your workspace',
      icon: Users,
      completed: false,
    },
    {
      id: 'share-on-x',
      title: 'Share on X',
      description: 'Help spread the word about Cortext on social media',
      icon: Share2,
      completed: false,
    },
  ])

  // Check if user has completed any steps from user preferences
  useEffect(() => {
    const completedSteps = onboardingPrefs.onboardingCompletedSteps || []
    
    setSteps(prevSteps => 
      prevSteps.map(step => ({
        ...step,
        completed: completedSteps.includes(step.id)
      }))
    )
  }, [onboardingPrefs.onboardingCompletedSteps])

  // Check if step 1 (create article) should be marked as completed based on article count
  useEffect(() => {
    if (articleCount > 0) {
      const completedSteps = onboardingPrefs.onboardingCompletedSteps || []
      if (!completedSteps.includes('create-article')) {
        // Auto-complete step 1 if user has articles but hasn't marked it complete yet
        const newCompletedSteps = [...completedSteps, 'create-article']
        updatePreferencesMutation.mutate({
          onboardingCompletedSteps: newCompletedSteps
        })
      }
      
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.id === 'create-article' 
            ? { ...step, completed: true }
            : step
        )
      )
    }
  }, [articleCount, onboardingPrefs.onboardingCompletedSteps])

  const handleStepAction = (stepId: string) => {
    // Execute the appropriate action based on step
    switch (stepId) {
      case 'create-article':
        if (onCreateArticle) {
          onCreateArticle()
          // Mark as completed after action
          markStepCompleted(stepId)
        }
        break
      case 'choose-template':
        if (onChooseTemplate) {
          onChooseTemplate()
          markStepCompleted(stepId)
        }
        break
      case 'invite-team':
        if (onInviteTeam) {
          onInviteTeam()
          markStepCompleted(stepId)
        }
        break
      case 'share-on-x':
        if (onShareOnX) {
          onShareOnX()
          markStepCompleted(stepId)
        }
        break
      default:
        markStepCompleted(stepId)
    }
  }

  // Mutation to update user preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updatedPrefs: OnboardingPreferences) => {
      const currentPrefs = userPrefs || {}
      const newPrefs = { ...currentPrefs, ...updatedPrefs }
      return account.updatePrefs(newPrefs)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'preferences'] })
    },
    onError: (error) => {
      console.error('Failed to update preferences:', error)
      toast({
        title: 'Failed to save progress',
        description: 'Could not save onboarding progress. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const markStepCompleted = (stepId: string) => {
    const completedSteps = onboardingPrefs.onboardingCompletedSteps || []
    if (!completedSteps.includes(stepId)) {
      const newCompletedSteps = [...completedSteps, stepId]
      updatePreferencesMutation.mutate({
        onboardingCompletedSteps: newCompletedSteps
      })
    }

    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId 
          ? { ...step, completed: true }
          : step
      )
    )

    // Check if all steps are completed
    const allCompleted = steps.every(step => step.id === stepId ? true : step.completed)
    if (allCompleted && onComplete) {
      onComplete()
    }
  }

  const allStepsCompleted = steps.every(step => step.completed)
  const isDismissed = onboardingPrefs.onboardingDismissed || false

  const handleDismiss = () => {
    updatePreferencesMutation.mutate({
      onboardingDismissed: true
    })
  }

  if (allStepsCompleted || isDismissed) {
    return null // Hide onboarding when all steps are completed or dismissed
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Welcome to Cortext!</h3>
          <p className="text-sm text-muted-foreground">Complete these steps to get started</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs">
            {steps.filter(step => step.completed).length} of {steps.length} completed
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss onboarding"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.id} className="relative">
              <div className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    step.completed 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.completed ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Step {index + 1}
                    </div>
                    <h4 className={`font-medium text-sm ${
                      step.completed ? 'text-primary' : 'text-foreground'
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                    
                    <div className="mt-3 h-7 flex items-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleStepAction(step.id)}
                      >
                        {step.id === 'create-article' && 'Create Article'}
                        {step.id === 'choose-template' && 'Choose Template'}
                        {step.id === 'invite-team' && 'Invite Team'}
                        {step.id === 'share-on-x' && 'Share on X'}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
