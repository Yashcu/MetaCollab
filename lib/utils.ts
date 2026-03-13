import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveRole(meta: Record<string, unknown>): "admin" | "user" {
  return meta.role === "admin" ? "admin" : "user";
}