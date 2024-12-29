import { useAuth } from "../hooks/useAuth";
import { useMe } from "../hooks/useMe";
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
} from "@nextui-org/react";

export const TopMenu = () => {
  const auth = useAuth();
  const me = useMe({ isPaused: () => auth === undefined });
  return (
    <Navbar isBordered>
      <NavbarContent>
        <NavbarBrand>
          <Link href="/">
            <h1 className="font-bold">JOSTRID</h1>
          </Link>
        </NavbarBrand>
      </NavbarContent>
      {auth && me.data && (
        <NavbarContent justify="end">
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
              <DropdownItem key="logout" as="a" href="/oauth/logout">
                Logga ut
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      )}
    </Navbar>
  );
};
