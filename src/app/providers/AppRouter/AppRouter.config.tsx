import { RouteObject } from "react-router-dom";
import { Main } from "@pages/Main";
import { FC, LazyExoticComponent, Suspense } from "react";


const ToLazy = (LazyComponent: LazyExoticComponent<FC>) => <Suspense fallback={''}><LazyComponent/></Suspense>

export const ROUTES : RouteObject[] = [{
  path: '/',
  element: ToLazy(Main)
}];
