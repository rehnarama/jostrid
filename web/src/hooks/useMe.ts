import { z } from "zod";
import { useData } from "./useData";
import { SWRConfiguration } from "swr";
import { useCallback } from "react";
import { useApiClient } from "./useApiClient";

export const MeDto = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone_number: z.string().nullable(),
});
export type MeDto = z.infer<typeof MeDto>;
export const PatchMeDto = z.object({
  phone_number: z.string().optional(),
});
export type PatchMeDto = z.infer<typeof PatchMeDto>;

export const useMe = <Config extends SWRConfiguration>(config?: Config) => {
  const api = useApiClient();
  const result = useData("/api/me", MeDto, config);

  const patchMe = useCallback(
    (patchMe: PatchMeDto) => {
      return result.mutate(async () => {
        const response = await api.fetch("/api/me", {
          method: "PATCH",
          body: JSON.stringify(patchMe),
          headers: { "Content-Type": "application/json" },
        });
        return MeDto.parse(await response.json());
      });
    },
    [api, result]
  );

  return { ...result, patchMe };
};
