import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MEDICAL_NOTICE, MISSION_SENTENCE, SITE_NAME } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: MISSION_SENTENCE,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-foreground/15 px-4 py-6">
          <p className="mx-auto max-w-2xl text-sm opacity-80">
            {MEDICAL_NOTICE}
          </p>
        </footer>
      </body>
    </html>
  );
}
