import { Snackbar, SnackbarProps } from "@mui/joy";
import {
  createContext,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { assert } from "../utils/assert";

export interface ToastContext {
  show(
    message: ReactNode,
    color?: SnackbarProps["color"],
    variant?: SnackbarProps["variant"]
  ): void;
}
const ToastContext = createContext<ToastContext | null>(null);

export const ToastProvider = (props: PropsWithChildren) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Partial<SnackbarProps>>({});

  const show = useCallback<ToastContext["show"]>((message, color, variant) => {
    setConfig({ children: message, color, variant });
    setIsOpen(true);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {props.children}
      <Snackbar
        {...config}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        autoHideDuration={3000}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  assert(context, "Must be used within ToastProvider");
  return context;
};
