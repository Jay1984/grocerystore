import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/toast";
import { FavoritesProvider } from "@/components/favorites-provider";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GroceryCompare BH",
  description: "Compare grocery prices across Bahrain retailers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}` }} />
      </head>
      <body className="min-h-full font-sans text-[var(--color-text-primary)] bg-[var(--color-page-bg)]">
        <ThemeProvider>
        <FavoritesProvider>
          {/* Mobile nav - hidden on desktop */}
          <div className="lg:hidden">
            <Navigation />
          </div>

          <div className="flex min-h-screen">
            {/* Desktop sidebar */}
            <Sidebar />

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
              <main className="flex-1">{children}</main>
              <footer className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)] py-3 text-center text-[12px] text-[var(--color-text-secondary)]">
                GroceryCompare BH &mdash; Prices in BHD. Data from public retailer websites.
              </footer>
            </div>
          </div>
          <Toaster />
        </FavoritesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
