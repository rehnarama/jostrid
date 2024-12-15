import {
  CircularProgress,
  Link as JoyLink,
  LinkProps as JoyLinkProps,
} from "@mui/joy";
import { forwardRef, useTransition } from "react";
import { To, useHref, useNavigate } from "react-router";

export interface LinkProps extends JoyLinkProps {
  to: To;
  defer?: boolean;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, defer, ...linkProps },
  ref
) {
  const routerNavigate = useNavigate();
  const [isTransitioning, startTransition] = useTransition();
  const href = useHref(to);

  const navigate = (to: To) => {
    if (defer) {
      startTransition(() => {
        routerNavigate(to);
      });
    } else {
      routerNavigate(to);
    }
  };

  return (
    <JoyLink
      {...linkProps}
      ref={ref}
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
      startDecorator={isTransitioning ? <CircularProgress size="sm" /> : null}
    />
  );
});
