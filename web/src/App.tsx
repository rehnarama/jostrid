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
import { NextUIProvider, Progress } from "@nextui-org/react";
import { useEffect, useTransition } from "react";
import { useAuth } from "./hooks/useAuth";

const Bootstrap = () => {
  const auth = useAuth();
  const location = useLocation();
  const [isTransitioning, startTransition] = useTransition();
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

  const needAuthentication = !auth && location.pathname !== "/login";
  useEffect(() => {
    if (needAuthentication) {
      navigateRaw("/login");
    }
  }, [needAuthentication, navigateRaw]);

  if (needAuthentication) {
    return null;
  }

  return (
    <NextUIProvider navigate={navigate} useHref={useHref}>
      <ToastProvider>
        {isTransitioning && (
          <Progress
            className="fixed top-0 left-0 right-0 z-50 fade-in"
            size="sm"
            isIndeterminate
            aria-label="Loading page"
          />
        )}
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
