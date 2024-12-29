import { useMemo } from "react";
import { useCookie } from "./useCookie";
import { jwtDecode, JwtPayload } from "jwt-decode";

interface JostridJwtPayload extends JwtPayload {
  name: string;
  preferred_username: string;
  scp: string;
  exp: number;
}

const ACCESS_TOKEN_COOKIE_NAME = "access_token";
export const useAuth = () => {
  const cookie = useCookie(ACCESS_TOKEN_COOKIE_NAME);

  const token = useMemo(() => {
    if (cookie) {
      return jwtDecode<JostridJwtPayload>(cookie);
    }
  }, [cookie]);

  return token;
};
