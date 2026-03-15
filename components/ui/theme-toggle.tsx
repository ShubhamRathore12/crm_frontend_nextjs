"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full"
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4 shrink-0" />
          Light Mode
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 shrink-0" />
          Dark Mode
        </>
      )}
    </button>
  );
}
