import { type FC } from "react";


import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { ROUTES } from "./AppRouter.config";

const routes = createBrowserRouter(ROUTES)

export const AppRouter: FC = () => {
  return <RouterProvider router={routes} />;
};
