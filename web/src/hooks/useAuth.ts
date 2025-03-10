import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { useLocation, useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import memoize from "lodash-es/memoize";
import { z } from "zod";
import EventEmitter from "eventemitter3";
import { toError } from "../lib/utils";
import { addToast } from "@heroui/react";

const AuthenticationResultDto = z.object({
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
  access_token: z.string(),
  refresh_token: z.string().optional(),
  scope: z.string(),
  expires_in: z.number(),
});
type AuthenticationResultDto = z.infer<typeof AuthenticationResultDto>;

const AUTH_RESULT_KEY = "auth-result";

class AuthClient extends EventEmitter<"change"> {
  private data: {
    authResult: AuthenticationResultDto;
    payload: JostridJwtPayload;
  } | null = null;
  private refreshPromise: null | Promise<AuthenticationResultDto> = null;

  constructor() {
    super();

    const result = AuthenticationResultDto.safeParse(
      JSON.parse(localStorage[AUTH_RESULT_KEY] ?? "{}"),
    );
    if (result.success) {
      this.setAuthResult(result.data);
    }
  }

  public isTokenValid = (tokenPayload: JostridJwtPayload) => {
    const expires = tokenPayload.exp * 1000;
    return Date.now() < expires;
  };

  public getToken = async (): Promise<string> => {
    if (this.data?.authResult && this.isTokenValid(this.data.payload)) {
      return this.data.authResult.access_token;
    } else if (this.data?.authResult) {
      return (await this.refreshToken()).access_token;
    } else {
      throw new Error(
        "No valid token nor any refresh token. User need to login again",
      );
    }
  };

  public acquireToken = memoize(async (code: string, state: string) => {
    const response = await fetch(
      `/api/oauth/callback?code=${code}&state=${state}`,
    );
    const data = await response.json();
    this.setAuthResult(AuthenticationResultDto.parse(data));
  });

  public refreshToken = () => {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshTokenInternal().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  };

  private refreshTokenInternal = async (): Promise<AuthenticationResultDto> => {
    if (
      this.data === null ||
      this.data.authResult.refresh_token === undefined
    ) {
      throw new Error(
        "No refresh token available to refresh access token with.",
      );
    }

    try {
      const response = await fetch(`/api/oauth/refresh`, {
        method: "POST",
        body: JSON.stringify({
          refresh_token: this.data.authResult.refresh_token,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = AuthenticationResultDto.parse(await response.json());
      this.setAuthResult(data);
      return data;
    } catch (e) {
      console.error(
        new Error("Failed to refresh token", { cause: toError(e) }),
      );
      this.data = null;
      this.emit("change");
      throw e;
    }
  };

  public logout = () => {
    this.data = null;
    this.emit("change");
  };

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
  const clientData = client.use();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/oauth/callback") {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code || !state) {
        addToast({
          title: "Failed to login",
          description: "Missing either code or state",
          color: "danger",
        });
        navigate("/login");
        return;
      }

      client.acquireToken(code, state);
    }
  }, [location, navigate, searchParams]);

  const login = useCallback(async () => {
    const redirectUrlResponse = await fetch("/api/oauth/redirect");
    const redirectUrl = await redirectUrlResponse.text();

    document.location.assign(redirectUrl);
  }, []);

  return {
    isAuthenticated: clientData
      ? client.isTokenValid(clientData.payload)
      : false,
    canRefresh: clientData !== null,
    refresh: client.refreshToken,
    logout: client.logout,
    login,
    client,
  };
};

export const AuthGuard = (props: PropsWithChildren) => {
  const navigate = useNavigate();
  const { isAuthenticated, canRefresh } = useAuth();

  const needAuthentication =
    !isAuthenticated &&
    !canRefresh &&
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
