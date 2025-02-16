import { useCallback } from "react";
import { useAuth } from "./useAuth";
import { useNavigate } from "react-router";

const { VITE_BACKEND_URL } = import.meta.env;

export const useApiClient = () => {
  const navigate = useNavigate();
  const { client: authClient } = useAuth();
  const jostridFetch = useCallback<typeof fetch>(
    async (input, init) => {
      const headers = init?.headers ?? {};
      const url =
        typeof input === "string" ? `${VITE_BACKEND_URL}${input}` : input;
      let token: string;
      try {
        token = await authClient.getToken();
      } catch (e) {
        navigate("/login");
        throw e;
      }

      return fetch(url, {
        ...init,
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`,
        },
        mode: VITE_BACKEND_URL !== "" ? "cors" : undefined,
      });
    },
    [authClient, navigate]
  );

  return { fetch: jostridFetch };
};
