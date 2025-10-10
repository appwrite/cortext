import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/test-error')({
  component: TestErrorComponent,
})

function TestErrorComponent() {
  // This will throw an error to test the error boundary
  throw new Error('This is a test error to demonstrate the error page')
}
