import { Navigate, RouteObject } from "react-router";
import { ExpenseListPage } from "./pages/ExpenseListPage";
import { ExpensePage } from "./pages/ExpensePage";

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
    path: "/",
    element: <Navigate to="/expense" replace />,
  },
];
