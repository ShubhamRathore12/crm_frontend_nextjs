"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";
  const label = isDark ? "Light Mode" : "Dark Mode";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={compact ? label : undefined}
      className={
        "flex items-center gap-3 rounded-md py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full " +
        (compact ? "justify-center px-0" : "px-3")
      }
    >
      {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      {!compact && label}
    </button>
  );
}
