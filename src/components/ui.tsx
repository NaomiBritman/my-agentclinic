import { CircleAlert, CircleCheck, Info, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The shared look of the site. Pages use these instead of styling their own
 * bands, cards, buttons, fields and notices, so that everything stays consistent.
 */

export type PageWidth = "narrow" | "medium" | "wide";

const WIDTHS: Record<PageWidth, string> = {
  narrow: "max-w-md",
  medium: "max-w-3xl",
  wide: "max-w-5xl",
};

export const buttonClasses =
  "inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-action px-6 py-2 font-semibold text-action-ink transition-colors hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export const secondaryButtonClasses =
  "inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-control bg-card px-6 py-2 font-semibold text-ink transition-colors hover:bg-chip-teal sm:w-auto";

/** For a button that sits on the page band. */
export const bandButtonClasses =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-band-ink px-6 py-2 font-semibold text-band-to transition-opacity hover:opacity-90 sm:w-auto";

/** For a second button that sits on the page band. */
export const bandOutlineButtonClasses =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-band-ink px-6 py-2 font-semibold text-band-ink transition-colors hover:bg-band-ink/15 sm:w-auto";

export const fieldClasses =
  "mt-1 min-h-11 w-full rounded-xl border border-control bg-card px-3 py-2 text-base text-ink";

export const labelClasses = "block font-medium";

export const helpClasses = "mt-1 text-muted";

export function PageBand({
  icon: Icon,
  title,
  width = "wide",
  children,
}: {
  icon: LucideIcon;
  title: string;
  width?: PageWidth;
  children?: ReactNode;
}) {
  return (
    <div className="on-band bg-gradient-to-br from-band-from to-band-to text-band-ink">
      <div className={`mx-auto ${WIDTHS[width]} px-4 pt-8 pb-16 sm:pt-12 sm:pb-20`}>
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-band-ink/15">
            <Icon aria-hidden className="size-6" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
        </div>
        <span aria-hidden className="mt-4 block h-1 w-14 rounded-full bg-accent" />
        {children}
      </div>
    </div>
  );
}

/** The page content, which slightly overlaps the band above it. */
export function PageContent({
  width = "wide",
  children,
}: {
  width?: PageWidth;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto -mt-10 ${WIDTHS[width]} px-4 pb-12`}>{children}</div>
  );
}

/** For a link that wraps a whole card. */
export const cardLinkClasses =
  "block rounded-2xl transition-transform hover:-translate-y-0.5";

const CARD_ACCENTS = {
  teal: "border-t-4 border-t-action",
  coral: "border-t-4 border-t-highlight",
  yellow: "border-t-4 border-t-accent",
};

export function Card({
  accent,
  className = "",
  children,
}: {
  accent?: keyof typeof CARD_ACCENTS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-6 ${
        accent ? CARD_ACCENTS[accent] : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

const CHIP_TONES = {
  teal: "bg-chip-teal text-chip-teal-ink",
  coral: "bg-chip-coral text-chip-coral-ink",
};

export type ChipTone = keyof typeof CHIP_TONES;

export function IconChip({
  icon: Icon,
  tone,
}: {
  icon: LucideIcon;
  tone: ChipTone;
}) {
  return (
    <span
      className={`grid size-10 shrink-0 place-items-center rounded-xl ${CHIP_TONES[tone]}`}
    >
      <Icon aria-hidden className="size-5" />
    </span>
  );
}

export function SectionHeading({
  icon,
  tone,
  children,
}: {
  icon: LucideIcon;
  tone: ChipTone;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <IconChip icon={icon} tone={tone} />
      <h2 className="text-xl font-semibold">{children}</h2>
    </div>
  );
}

/** Something important to read, such as an approved message. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl bg-notice p-4 text-notice-ink"
    >
      <Info aria-hidden className="mt-0.5 size-5 shrink-0" />
      <p className="font-medium">{children}</p>
    </div>
  );
}

/** A message about something the person just did. */
export function FormMessage({
  tone,
  id,
  children,
}: {
  tone: "error" | "done";
  id?: string;
  children: ReactNode;
}) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <p
      id={id}
      role={tone === "error" ? "alert" : "status"}
      className={`mt-2 flex items-start gap-2 font-medium ${
        tone === "error" ? "text-highlight" : "text-chip-teal-ink"
      }`}
    >
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
