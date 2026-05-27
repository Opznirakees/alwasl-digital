import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoKufiArabic = Noto_Kufi_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "الوصل الرقمي | Al-Wasl Digital - Gaming Top-Up Platform",
  description: "Your trusted platform for gaming top-ups, gift cards, and digital services. Instant delivery, secure payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoKufiArabic.variable} font-sans antialiased bg-slate-950 text-white`}
      >
        <AppProvider>
          {children}
          <Toaster position="top-center" richColors />
        </AppProvider>
      </body>
    </html>
  );
}
