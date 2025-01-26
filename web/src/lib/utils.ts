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

const SWISH_BASE_URL = "https://app.swish.nu/1/p/sw/";
export const generateSwishLink = (
  phoneNumber: string,
  amount: number,
  message: string,
  edit = "amt,msg"
): string => {
  // https://developer.swish.nu/documentation/guides/generate-qr-codes#create-qr-code-from-specification
  // Amount to pay, empty values are not allowed. Decimal separator is '.'
  const amountStr = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });

  return `${SWISH_BASE_URL}?sw=${phoneNumber}&amt=${amountStr}&msg=${message}&edit=${edit}`;
};
