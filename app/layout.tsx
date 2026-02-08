"use client";

import "./globals.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import SidebarNav from "@/components/SidebarNav";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-zinc-100 min-h-screen">
        <ConvexProvider client={convex}>
          <div className="min-h-screen md:flex">
            <SidebarNav />
            <main className="flex-1">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </div>
            </main>
          </div>
        </ConvexProvider>
      </body>
    </html>
  );
}
