"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";

export const useTheme = () => {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      root.classList.add(systemPrefersDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;

    const root = document.documentElement;

    const handleSystemChange = (event: MediaQueryListEvent) => {
      root.classList.remove("light", "dark");
      root.classList.add(event.matches ? "dark" : "light");
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, [theme]);

  return { theme, setTheme };
};