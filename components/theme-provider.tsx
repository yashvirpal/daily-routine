"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/** Wraps next-themes' provider — layout.tsx is a Server Component and can't
 * call the client-only useTheme() hook, so this thin client boundary is
 * needed to add class="dark"/"light" to <html> and persist the choice. */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
