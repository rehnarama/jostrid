import { useCallback, useMemo, useSyncExternalStore } from "react";

export const useCookie = (name: string) => {
  const regex = useMemo(() => {
    return new RegExp(`${name}=([^;]+)`);
  }, [name]);
  const getSnapshot = useCallback(() => {
    const match = document.cookie.match(regex);
    if (match) {
      return match[1];
    }
  }, [regex]);
  const subscribe = useCallback((fn: () => void) => {
    // CookieStore API not yet suported in firefox. Let's "manually" watch cookies instead
    let lastCookie = document.cookie;
    const intervalHandle = setInterval(() => {
      const cookie = document.cookie;
      if (cookie !== lastCookie) {
        fn();
        lastCookie = cookie;
      }
    }, 1000);

    return () => {
      clearInterval(intervalHandle);
    };
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot);
};
