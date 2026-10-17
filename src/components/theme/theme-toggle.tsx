"use client";

import { useEffect, useState } from "react";
import { Moon, Sparkles, Sun } from "lucide-react";
import { headerIconClass } from "@/components/layout/header-icon";
import { useTheme, type Theme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "plain";
}) {
  const { theme, toggleTheme } = useTheme();
  const [animating, setAnimating] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visualTheme, setVisualTheme] = useState<Theme>(theme);
  const [leavingTheme, setLeavingTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!animating) setVisualTheme(theme);
  }, [theme, animating]);

  function handleToggle() {
    if (animating) return;

    const next: Theme = visualTheme === "dark" ? "light" : "dark";

    if (reducedMotion) {
      toggleTheme();
      setVisualTheme(next);
      return;
    }

    setLeavingTheme(visualTheme);
    setAnimating(true);

    window.setTimeout(() => {
      toggleTheme();
      setVisualTheme(next);
    }, 200);

    window.setTimeout(() => {
      setAnimating(false);
      setLeavingTheme(null);
    }, 520);
  }

  const shown = leavingTheme ?? visualTheme;
  const isDark = shown === "dark";
  const goingToDark = animating && leavingTheme === "light";
  const label = visualTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className={cn(
        variant === "plain"
          ? headerIconClass
          : "relative z-[60] flex h-11 w-11 min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center overflow-visible rounded-full border border-border shadow-md backdrop-blur-md bg-[var(--header-bg)] text-foreground transition-colors duration-300 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10",
        "touch-manipulation overflow-visible active:scale-95",
        className
      )}
    >
      <span className="relative flex h-6 w-6 items-center justify-center overflow-visible">
        <Sun
          className={cn(
            "absolute h-5 w-5 text-gold",
            animating
              ? isDark
                ? "animate-celestial-in"
                : "animate-celestial-out"
              : isDark
                ? "pointer-events-none opacity-0"
                : "opacity-100"
          )}
          strokeWidth={2.25}
          aria-hidden
        />
        <Moon
          className={cn(
            "absolute h-5 w-5 text-lavender",
            animating
              ? isDark
                ? "animate-celestial-out"
                : "animate-celestial-in"
              : isDark
                ? "opacity-100"
                : "pointer-events-none opacity-0"
          )}
          strokeWidth={2.25}
          aria-hidden
        />
        {goingToDark && !reducedMotion && (
          <Sparkles
            className="absolute -right-1.5 -top-1.5 h-3 w-3 text-gold animate-celestial-twinkle"
            strokeWidth={2}
            aria-hidden
          />
        )}
      </span>
    </button>
  );
}
