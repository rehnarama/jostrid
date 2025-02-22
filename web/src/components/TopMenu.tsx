import { useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useMe } from "../hooks/useMe";
import {
  Avatar,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Navbar,
  NavbarContent,
} from "@heroui/react";
import { IconArrowLeft } from "@tabler/icons-react";

const PATH_TO_NAME_MAP: Record<string, string> = {
  expense: "Splitten",
};

export const TopMenu = () => {
  const location = useLocation();
  const auth = useAuth();
  const me = useMe({ isPaused: () => !auth.isAuthenticated });

  const crumbs: Array<{ href: string; name: string }> = [
    {
      href: "/",
      name: "Jostrid",
    },
  ];
  const paths = location.pathname.slice(1).split("/");
  let currentPath = "";
  for (const path of paths) {
    if (path === "") {
      continue;
    }
    currentPath += `/${path}`;
    crumbs.push({
      href: currentPath,
      name: PATH_TO_NAME_MAP[path] ?? path,
    });
  }
  const prevCrumb = crumbs.length >= 2 ? crumbs[crumbs.length - 2] : null;

  return (
    <Navbar isBordered>
      <NavbarContent>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          isDisabled={prevCrumb === null}
          as={Link}
          href={prevCrumb !== null ? prevCrumb.href : undefined}
        >
          <IconArrowLeft />
        </Button>
        <Breadcrumbs>
          {crumbs.map((crumb) => {
            return (
              <BreadcrumbItem key={crumb.href} href={crumb.href}>
                {crumb.name}
              </BreadcrumbItem>
            );
          })}
        </Breadcrumbs>
      </NavbarContent>
      {auth && me.data && (
        <NavbarContent justify="end" className="data-[justify=end]:flex-grow-0">
          <Dropdown>
            <DropdownTrigger>
              <Avatar
                size="sm"
                isBordered
                color="secondary"
                className="cursor-pointer"
                name={me.data.name}
              />
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key="profile">
                <p className="font-semibold">Inloggad som</p>
                <p className="font-semibold">{me.data.email}</p>
              </DropdownItem>
              <DropdownItem key="logout" onPress={auth.logout}>
                Logga ut
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      )}
    </Navbar>
  );
};
