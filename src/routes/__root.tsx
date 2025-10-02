import { RouterContext } from "@/main";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { FullscreenLoader } from "@/components/ui/loader";
import { useInitialLoader } from "@/hooks/use-initial-loader";

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
  },
  component: () => {
    const { isLoading } = useInitialLoader();
    
    return (
      <>
        <FullscreenLoader isVisible={isLoading} />
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </>
    );
  },
});
