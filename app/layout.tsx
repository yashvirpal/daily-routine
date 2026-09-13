import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
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

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getAppSettings();
  return {
    title: siteName,
    description: "A daily routine and habit tracker.",
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [session, { siteName }] = await Promise.all([
    getSession(),
    getAppSettings(),
  ]);
  const user = session ? await getUserById(session.sub) : null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Nav user={user} siteName={siteName} />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
