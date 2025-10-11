import { getAccountClient } from "@/lib/appwrite";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const account = getAccountClient();
  const queryClient = useQueryClient();
  const { data: user, isPending, isLoading } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: () => account.get(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const deleteSession = async () => {
    localStorage.removeItem("imaginePreviewToken");
    
    try {
      await account.deleteSession("current");
    } catch (error) {
      console.error(error);
    }
  }

  const signOut = useMutation({
    mutationFn: deleteSession,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      window.location.reload();
    }
  });

  return {
    isPending,
    isLoading,
    user,
    isAuthenticated: !!user,
    signOut,
  };
}
