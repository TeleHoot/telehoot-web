import { lazy } from "react";

export const TelegramLogin = lazy(() => import("./TelegramLogin"));
export type { TelegramLoginData } from "./TelegramLogin.types";
