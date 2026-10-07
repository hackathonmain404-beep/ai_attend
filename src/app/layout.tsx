import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";
import { DemoTourFloatingButton } from "@/components/presentation/DemoTourFloatingButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AttendGuard — Verified Attendance & Proxy Prevention",
  description:
    "Secure, cryptographic, real-time attendance verification platform for academic institutions.",
  applicationName: "AttendGuard",
  authors: [{ name: "AttendGuard Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#090d16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#070b12] text-slate-100 min-h-screen antialiased flex flex-col`}>
        <QueryProvider>
          {children}
          <DemoTourFloatingButton />
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              className: "border border-slate-700 bg-slate-900 text-slate-100 shadow-xl",
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
