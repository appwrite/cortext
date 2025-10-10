import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  beforeLoad: () => {
    // Redirect any unmatched routes to the 404 page
    throw redirect({
      to: '/404',
    })
  },
})
