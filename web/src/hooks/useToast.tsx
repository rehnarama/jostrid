import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { assert } from "../utils/assert";
import { Alert, AlertProps } from "@nextui-org/react";

const AUTO_HIDE_TIMEOUT = 3000;

export interface ToastContext {
  show(
    title: string,
    description?: string,
    color?: AlertProps["color"],
    variant?: AlertProps["variant"]
  ): void;
}
const ToastContext = createContext<ToastContext | null>(null);

export const ToastProvider = (props: PropsWithChildren) => {
  const [config, setConfig] = useState<Pick<
    AlertProps,
    "title" | "description" | "color" | "variant"
  > | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback<ToastContext["show"]>(
    (title, description, color, variant) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setConfig({ title, description, color, variant });
      timeoutRef.current = setTimeout(() => {
        setConfig(null);
      }, AUTO_HIDE_TIMEOUT);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {props.children}
      {config && (
        <div className="fixed bottom-2 right-2">
          <Alert {...config} onClose={() => setConfig(null)} />
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  assert(context, "Must be used within ToastProvider");
  return context;
};
