import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { routes } from "./routes";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import { ToastProvider } from "./hooks/useToast";

const Bootstrap = () => {
  return (
    <CssVarsProvider>
      <CssBaseline />
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </CssVarsProvider>
  );
};

function App() {
  return <RouterProvider router={router} />;
}

const router = createBrowserRouter([
  {
    children: routes,
    element: <Bootstrap />,
  },
]);
export default App;
