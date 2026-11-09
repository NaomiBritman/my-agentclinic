import { GoogleGenAI } from "@google/genai";

import type { AiProvider } from "./provider";

/**
 * The Gemini API, used only on the server, and only with built-in made-up test
 * profiles. The key comes only from .env. Returns null when it isn't set up,
 * which shows the same neutral message as any other failure.
 */
export function getAiProvider(): AiProvider | null {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) return null;

  const client = new GoogleGenAI({
    apiKey,
    // Nothing retries automatically, which protects the free tier quota.
    httpOptions: { retryOptions: { attempts: 1 } },
  });

  return {
    async generate({ prompt, schema, signal }) {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          abortSignal: signal,
        },
      });
      return response.text ?? "";
    },
  };
}
