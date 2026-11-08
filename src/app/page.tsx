import { MISSION_SENTENCE, SITE_NAME } from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
        {SITE_NAME}
      </h1>
      <p className="mt-4 text-lg leading-8 opacity-80">{MISSION_SENTENCE}</p>
    </main>
  );
}
