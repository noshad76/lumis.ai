import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Lumis.ai",
  description: "Intelligent knowledge retrieval platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex bg-bg text-text">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden ml-[var(--sidebar-width)]">
          {children}
        </main>
      </body>
    </html>
  );
}
