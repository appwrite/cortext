import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/react-query";

export interface RouterContext {
  queryClient: QueryClient;
}

// Create a new router instance
const router = createRouter({ routeTree } as any);

export function App() {
  const initialContext: RouterContext = {
    queryClient,
  };

  return <RouterProvider router={router} context={initialContext} />;
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
          <App />
      </QueryClientProvider>
    </StrictMode>
  );
}
