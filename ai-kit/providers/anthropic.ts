// ai-kit/providers/anthropic.ts
// Anthropic BYOK provider — lazy import, no package required in consumers.

import type { LLMProvider } from "./base";
import type { ChatOptions, ChatResponse } from "../types";
import { ProviderError } from "../errors";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export function createAnthropicProvider(apiKey: string): LLMProvider {
  return {
    name: "anthropic",
    priority: 99,

    isAvailable() {
      return !!apiKey;
    },

    async chat(opts: ChatOptions): Promise<ChatResponse> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { default: Anthropic } = await import("@anthropic-ai/sdk" as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client: any = new Anthropic({ apiKey });

      const start = Date.now();
      const systemMsg = opts.messages.find((m) => m.role === "system")?.content;
      const messages = opts.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await client.messages.create({
          model: DEFAULT_MODEL,
          max_tokens: opts.maxTokens ?? 1024,
          system: systemMsg,
          messages,
        });

        const text: string =
          response.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";

        return {
          text,
          provider: "anthropic",
          model: response.model ?? DEFAULT_MODEL,
          latency_ms: Date.now() - start,
        };
      } catch (err: unknown) {
        const status =
          err instanceof Error && "status" in err ? (err as { status: number }).status : undefined;
        throw new ProviderError("anthropic", status, err);
      }
    },
  };
}
