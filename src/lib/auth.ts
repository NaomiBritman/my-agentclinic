import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import type { AppDatabase } from "@/db/database";
import * as schema from "@/db/schema";

type AuthOptions = {
  db: AppDatabase;
  secret: string;
  baseURL: string;
  plugins?: BetterAuthPlugin[];
};

export function createAuth({ db, secret, baseURL, plugins }: AuthOptions) {
  return betterAuth({
    secret,
    baseURL,
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: { enabled: true },
    plugins,
    telemetry: { enabled: false },
    // Library logs could include personal details, so they stay off.
    logger: { disabled: true },
    advanced: { ipAddress: { disableIpTracking: true } },
  });
}

export type Auth = ReturnType<typeof createAuth>;
