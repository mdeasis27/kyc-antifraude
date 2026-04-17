// ai-kit/providers/gemini.ts
// Gemini provider using @google/genai SDK (lazy import — no package required in consumers).

import type { LLMProvider } from "./base";
import type { ChatOptions, ChatResponse } from "../types";
import { ProviderError } from "../errors";

const DEFAULT_MODEL = "gemini-2.0-flash";

export function createGeminiProvider(apiKey: string | undefined): LLMProvider {
  return {
    name: "gemini",
    priority: 1,

    isAvailable() {
      return !!apiKey;
    },

    async chat(opts: ChatOptions): Promise<ChatResponse> {
      if (!apiKey) {
        throw new ProviderError("gemini", undefined);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { GoogleGenAI } = await import("@google/genai" as any);
      const genai = new GoogleGenAI({ apiKey });

      const start = Date.now();

      const systemMsg = opts.messages.find((m) => m.role === "system");
      const userMessages = opts.messages.filter((m) => m.role !== "system");

      const contents = userMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await genai.models.generateContent({
          model: DEFAULT_MODEL,
          contents,
          config: {
            maxOutputTokens: opts.maxTokens ?? 1024,
            temperature: opts.temperature ?? 0.7,
            ...(systemMsg ? { systemInstruction: systemMsg.content } : {}),
          },
        });

        const text: string = response.text ?? "";

        return {
          text,
          provider: "gemini",
          model: DEFAULT_MODEL,
          latency_ms: Date.now() - start,
        };
      } catch (err: unknown) {
        const status =
          err instanceof Error && "status" in err ? (err as { status: number }).status : undefined;
        throw new ProviderError("gemini", status, err);
      }
    },
  };
}
