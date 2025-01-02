import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toError = (e: unknown): Error => {
  if (e instanceof Error) {
    return e;
  }
  return new Error(JSON.stringify(e));
};

export const errorLikeToMessage = (e: unknown): string => {
  const error = toError(e);
  return `${error.name}: ${error.message}`;
};
