/** What the generation code needs from an AI provider, and nothing more. */
export type AiRequest = {
  prompt: string;
  schema: object;
  signal: AbortSignal;
};

export type AiProvider = {
  /** Returns the provider's raw text, which is untrusted. */
  generate(request: AiRequest): Promise<string>;
};

/** Each request stops after two minutes. This isn't a health number. */
export const REQUEST_TIMEOUT_MS = 120_000;

/**
 * When the provider says it is overloaded (HTTP 503), a build tries again at most
 * this many times in total, which protects the free tier quota. Nothing else is
 * ever retried. These aren't health numbers.
 */
export const MAX_RETRIES_PER_BUILD = 2;
export const RETRY_WAIT_MS = 20_000;
