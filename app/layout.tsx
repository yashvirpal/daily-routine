import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppSidebar } from "@/components/app-sidebar";
import { Nav } from "@/components/nav";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/server/auth";
import { getAppSettings } from "@/lib/server/app-settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Track daily habits and routines, see your streaks, and stay consistent — a simple, fast daily routine tracker.";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getAppSettings();
  const url = process.env.APP_URL || "http://localhost:3000";
  return {
    // Needed so relative URLs (Open Graph, etc.) resolve to an absolute one
    // instead of Next's build-time localhost default.
    metadataBase: new URL(url),
    title: { default: siteName, template: `%s · ${siteName}` },
    description: DESCRIPTION,
    openGraph: {
      title: siteName,
      description: DESCRIPTION,
      url,
      siteName,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: siteName,
      description: DESCRIPTION,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [session, { siteName }] = await Promise.all([
    getSession(),
    getAppSettings(),
  ]);
  const user = session ? await getUserById(session.sub) : null;
  const isAdmin = user?.role === "ADMIN";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Nav user={user} siteName={siteName} />
          {isAdmin ? (
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:flex-row sm:gap-8">
              <AppSidebar />
              <main className="min-w-0 flex-1">{children}</main>
            </div>
          ) : (
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
              {children}
            </main>
          )}
          <SiteFooter />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
