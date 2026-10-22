import type { Metadata } from "next";
import "./globals.css";
import { AdminUIProvider, AuthProvider, PortfolioProvider } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminOverlay from "@/components/AdminOverlay";

export const metadata: Metadata = {
  title: "Wahab Ahmad · Give Me An Idea, I Make It Perfect",
  description:
    "Multi-disciplinary portfolio of Wahab Ahmad — Designer & Assistant Developer bridging premium textile craft with autonomous software engineering. Based in Punjab, Pakistan.",
  keywords: [
    "Wahab Ahmad",
    "Portfolio",
    "Designer",
    "Developer",
    "Screen Printing",
    "Textile Design",
    "Next.js",
    "Punjab",
    "Pakistan",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased relative">
        <PortfolioProvider>
          <AuthProvider>
            <AdminUIProvider>
              <Header />
              <main className="relative z-10">{children}</main>
              <Footer />
              <AdminOverlay />
            </AdminUIProvider>
          </AuthProvider>
        </PortfolioProvider>
      </body>
    </html>
  );
}
