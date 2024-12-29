import { RouteObject } from "react-router";
import { ExpenseListPage } from "./pages/ExpenseListPage";
import { ExpensePage } from "./pages/ExpensePage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

export const routes: RouteObject[] = [
  {
    path: "/expense",
    element: <ExpenseListPage />,
  },
  {
    path: "/expense/:id",
    element: <ExpensePage />,
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
