import { type FC, Suspense } from "react";
import { AppRouter } from "./providers/AppRouter/AppRouter";

const App: FC = () => {
  return (
    <Suspense fallback={''}>
      <AppRouter />
    </Suspense>
  );
};

export default App;
