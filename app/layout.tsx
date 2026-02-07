"use client";

import "./globals.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";

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
          <header className="bg-white border-b border-zinc-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <a href="/" className="flex items-center gap-2">
                  <span className="text-2xl">🎬</span>
                  <span className="font-bold text-xl text-zinc-900">
                    Mission Control
                  </span>
                </a>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </ConvexProvider>
      </body>
    </html>
  );
}
