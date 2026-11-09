import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MEDICAL_NOTICE, MISSION_SENTENCE, SITE_NAME } from "@/lib/site";

import { SiteHeader } from "./site-header";

import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: MISSION_SENTENCE,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line bg-card py-6">
          <p className="mx-auto max-w-5xl px-4 text-muted">{MEDICAL_NOTICE}</p>
        </footer>
      </body>
    </html>
  );
}
