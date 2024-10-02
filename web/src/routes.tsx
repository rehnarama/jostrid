import { Navigate, RouteObject } from "react-router";
import { ExpenseListPage } from "./pages/ExpenseListPage";
import { ExpensePage } from "./pages/ExpensePage";
import { fetchExpenses } from "./loaders/ExpenseLoader";

export const routes: RouteObject[] = [
  {
    path: "/expense",
    element: <ExpenseListPage />,
    loader: fetchExpenses,
    id: "expense",
    children: [
      {
        path: "/expense/:id",
        element: <ExpensePage />,
      },
    ],
  },
  {
    path: "/",
    element: <Navigate to="/expense" replace />,
  },
];
