import { forwardRef, useTransition } from "react";
import { To, useHref, useNavigate } from "react-router";
import { Link as NextLink } from "@nextui-org/react";

export interface LinkProps {
  to: To;
  defer?: boolean;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, defer, ...linkProps },
  ref
) {
  const routerNavigate = useNavigate();
  const [_isTransitioning, startTransition] = useTransition();
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
    <NextLink
      {...linkProps}
      ref={ref}
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    />
  );
});
