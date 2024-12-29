import {
  createBrowserRouter,
  NavigateOptions,
  Outlet,
  RouterProvider,
  To,
  useHref,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { routes } from "./routes";
import { ToastProvider } from "./hooks/useToast";
import { TopMenu } from "./components/TopMenu";
import { NextUIProvider } from "@nextui-org/react";
import { useEffect, useTransition } from "react";
import { useAuth } from "./hooks/useAuth";

const Bootstrap = () => {
  const auth = useAuth();
  const location = useLocation();
  const [, startTransition] = useTransition();
  const navigateRaw = useNavigate();

  const navigate = (to: To | number, options?: NavigateOptions) => {
    startTransition(() => {
      // Just typescript and overloads not working pretty, requiring narrowing
      if (typeof to === "number") {
        navigateRaw(to);
      } else {
        navigateRaw(to, options);
      }
    });
  };

  useEffect(() => {
    if (!auth && location.pathname !== "/login") {
      console.log(auth, location.pathname);
      navigateRaw("/login");
    }
  }, [auth, location.pathname, navigateRaw]);

  return (
    <NextUIProvider navigate={navigate} useHref={useHref}>
      <ToastProvider>
        <TopMenu />
        <Outlet />
      </ToastProvider>
    </NextUIProvider>
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
