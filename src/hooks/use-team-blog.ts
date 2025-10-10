import { useTeamBlogContext } from '@/contexts/team-blog-context'

export function useTeamBlog(userId: string) {
  return useTeamBlogContext()
}