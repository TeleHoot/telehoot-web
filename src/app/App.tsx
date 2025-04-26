import { type FC, Suspense } from "react";
import { AppRouter } from "./providers/AppRouter/AppRouter";
import { QueryClient, QueryClientProvider } from "react-query";
import React from "react";

const queryClient = new QueryClient();

const App: FC = () => {

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={""}>
          <AppRouter />
        </Suspense>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
