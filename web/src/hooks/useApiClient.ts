import { useCallback } from "react";
import { useAuth } from "./useAuth";

const { VITE_BACKEND_URL } = import.meta.env;

export const useApiClient = () => {
  const auth = useAuth();
  const jostridFetch = useCallback<typeof fetch>(
    (input, init) => {
      const headers = init?.headers ?? {};
      const url =
        typeof input === "string" ? `${VITE_BACKEND_URL}${input}` : input;

      return fetch(url, {
        ...init,
        headers: {
          ...headers,
          Authorization: `Bearer ${auth.client.getToken()}`,
        },
      });
    },
    [auth]
  );

  return { fetch: jostridFetch };
};
