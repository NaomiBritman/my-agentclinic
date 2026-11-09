"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { navItemClasses } from "./nav-classes";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const current = usePathname() === href;

  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`${navItemClasses} ${
        current ? "bg-chip-teal font-semibold text-chip-teal-ink" : ""
      }`}
    >
      {children}
    </Link>
  );
}
