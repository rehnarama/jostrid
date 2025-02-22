import {
  createBrowserRouter,
  NavigateOptions,
  Outlet,
  RouterProvider,
  To,
  useHref,
  useNavigate,
} from "react-router-dom";
import { routes } from "./routes";
import { TopMenu } from "./components/TopMenu";
import { HeroUIProvider, Progress, ToastProvider } from "@heroui/react";
import { useTransition } from "react";
import { AuthGuard } from "./hooks/useAuth";

const Bootstrap = () => {
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

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <ToastProvider />
      {isTransitioning && (
        <Progress
          className="fixed top-0 left-0 right-0 z-50 fade-in"
          size="sm"
          isIndeterminate
          aria-label="Loading page"
        />
      )}
      <TopMenu />
      <AuthGuard>
        <Outlet />
      </AuthGuard>
    </HeroUIProvider>
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
