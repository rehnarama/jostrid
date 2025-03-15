import { z } from "zod";
import { useData } from "./useData";
import { SWRConfiguration } from "swr";

export const ImageDto = z.object({
  id: z.number(),
  url: z.string(),
  tags: z.string().array(),
});
export type ImageDto = z.infer<typeof ImageDto>;

export const useImage = <Config extends SWRConfiguration>(
  tag: string,
  config?: Config,
) => {
  return useData(`/api/image?tag=${tag}`, ImageDto.array(), config);
};
