import { RouterProvider as AriaRouterProvider } from "react-aria-components";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { routes } from "./routes";
import { useNavigate, useHref } from "react-router";

const Bootstrap = () => {
  let navigate = useNavigate();
  return (
    <AriaRouterProvider navigate={navigate} useHref={useHref}>
      <Outlet />
    </AriaRouterProvider>
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
