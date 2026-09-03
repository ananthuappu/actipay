import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

export const viewport: Viewport = {
  themeColor: "#0047ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "ActiPay Fitness - Member & Payment Tracker",
  description: "Stop paying flat SaaS fees. Pay only for active customers with ActiPay.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ActiPay Fitness",
  },
  icons: {
    icon: "/api/icon",
    apple: "/api/icon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/api/icon" />
      </head>
      <body className={`${nunito.className} bg-slate-50 text-slate-900 min-h-screen antialiased select-none`}>
        <AuthProvider>
          {children}
          <PwaInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}