import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { useLocation, useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { useToast } from "./useToast";
import memoize from "lodash-es/memoize";
import { z } from "zod";
import EventEmitter from "eventemitter3";

const AuthenticationResultDto = z.object({
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
  access_token: z.string(),
  expires_in: z.number(),
});
type AuthenticationResultDto = z.infer<typeof AuthenticationResultDto>;

const AUTH_RESULT_KEY = "auth-result";

class AuthClient extends EventEmitter<"change"> {
  private data: {
    authResult: AuthenticationResultDto;
    payload: JostridJwtPayload;
  } | null = null;

  constructor() {
    super();

    const result = AuthenticationResultDto.safeParse(
      JSON.parse(localStorage[AUTH_RESULT_KEY] ?? "{}")
    );
    if (result.success) {
      this.setAuthResult(result.data);
    }
  }

  public isAuthenticated = () => {
    if (!this.data) {
      return false;
    }
    const expires = this.data.payload.exp * 1000;
    return Date.now() < expires;
  };

  public getToken = () => {
    return this.data?.authResult.access_token;
  };

  public acquireToken = memoize(async (code: string, state: string) => {
    const response = await fetch(
      `/api/oauth/callback?code=${code}&state=${state}`
    );
    const data = await response.json();
    this.setAuthResult(AuthenticationResultDto.parse(data));
  });

  private setAuthResult = (authResult: AuthenticationResultDto) => {
    this.data = {
      authResult,
      payload: jwtDecode<JostridJwtPayload>(authResult.access_token),
    };
    localStorage[AUTH_RESULT_KEY] = JSON.stringify(authResult);
    this.emit("change");
  };

  public use = () => {
    const subscribe = useCallback((fn: () => void) => {
      this.on("change", fn);

      return () => {
        this.off("change", fn);
      };
    }, []);
    const getSnapshot = useCallback(() => {
      return this.data;
    }, []);

    return useSyncExternalStore(subscribe, getSnapshot);
  };
}

interface JostridJwtPayload extends JwtPayload {
  name: string;
  preferred_username: string;
  scp: string;
  exp: number;
}

const client = new AuthClient();

export const useAuth = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/oauth/callback") {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code || !state) {
        toast.show("Failed to login", "Missing either code or state", "danger");
        navigate("/login");
        return;
      }

      client.acquireToken(code, state);
    }
  }, [location, navigate, searchParams, toast]);

  const login = useCallback(async () => {
    const redirectUrlResponse = await fetch("/api/oauth/redirect");
    const redirectUrl = await redirectUrlResponse.text();

    document.location.assign(redirectUrl);
  }, []);

  return {
    isAuthenticated: client.isAuthenticated(),
    login,
    client,
  };
};

export const AuthGuard = (props: PropsWithChildren) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const needAuthentication =
    !isAuthenticated &&
    !(
      location.pathname === "/login" || location.pathname === "/oauth/callback"
    );
  useEffect(() => {
    if (needAuthentication) {
      navigate("/login");
    }
  }, [needAuthentication, navigate]);

  if (needAuthentication) {
    return null;
  }

  return props.children;
};
