import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uniqueBy<T, K>(array: T[], key: (item: T) => K): T[] {
  const seen = new Map<K, T>();

  for (const item of array) {
    const keyValue = key(item);
    if (!seen.has(keyValue)) {
      seen.set(keyValue, item);
    }
  }

  return Array.from(seen.values());
}
