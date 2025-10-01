import { getAccountClient } from "@/lib/appwrite";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const account = getAccountClient();
  const queryClient = useQueryClient();
  const { data: user, isPending } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: () => account.get(),
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
    user,
    isAuthenticated: !!user,
    signOut,
  };
}
