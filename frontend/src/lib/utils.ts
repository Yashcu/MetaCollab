import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A utility function from shadcn/ui to merge Tailwind CSS classes
 * without conflicts.
 * @param inputs - A list of class values.
 * @returns A string of combined and optimized class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
