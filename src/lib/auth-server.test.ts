import { afterEach, expect, test, vi } from "vitest";

import { createTestDatabase } from "@/db/test-database";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
}));
vi.mock("@/db/database", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db/database")>();
  return { ...actual, getDatabase: () => testDatabase.db };
});

const testDatabase = createTestDatabase();

vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-only-used-by-these-tests");
vi.stubEnv("BETTER_AUTH_URL", "http://127.0.0.1:3000");

afterEach(() => {
  redirect.mockClear();
});

test("a logged-out visitor to a personal page is sent to log in", async () => {
  const { requireAccount } = await import("./auth-server");

  await expect(requireAccount()).rejects.toThrow("redirect:/log-in");
});
