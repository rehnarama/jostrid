import { RouteObject } from "react-router";
import { ExpenseListPage } from "./pages/ExpenseListPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { OauthCallbackPage } from "./pages/OauthCallbackPage";
import { WeddingPage } from "./pages/WeddingPage";

export const routes: RouteObject[] = [
  {
    path: "/expense",
    element: <ExpenseListPage />,
  },
  {
    path: "/wedding",
    element: <WeddingPage />,
  },
  {
    path: "/oauth/callback",
    element: <OauthCallbackPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <HomePage />,
  },
];
