"use client";

// ai-kit/byok-input.tsx
// BYOK key input — detects provider by prefix, persists to localStorage.

import { useState, useEffect } from "react";
import type { UserApiKey } from "./types";

type Props = {
  onKeyChange: (key: UserApiKey | null) => void;
};

function detectProvider(key: string): UserApiKey["provider"] | null {
  if (key.startsWith("sk-ant-")) return "anthropic";
  if (key.startsWith("AIza") || key.startsWith("AQ.")) return "gemini";
  if (key.startsWith("sk-")) return "openai";
  return null;
}

const STORAGE_KEY = "mdea_byok_key";

export function ApiKeyInput({ onKeyChange }: Props) {
  const [value, setValue] = useState("");
  const [detected, setDetected] = useState<UserApiKey["provider"] | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setValue(stored);
      const provider = detectProvider(stored);
      setDetected(provider);
      if (provider) onKeyChange({ provider, key: stored });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.trim();
    setValue(v);
    const provider = detectProvider(v);
    setDetected(provider);
    if (v === "") {
      localStorage.removeItem(STORAGE_KEY);
      onKeyChange(null);
    } else if (provider) {
      localStorage.setItem(STORAGE_KEY, v);
      onKeyChange({ provider, key: v });
    } else {
      onKeyChange(null);
    }
  }

  const label: Record<UserApiKey["provider"], string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    gemini: "Google Gemini",
  };

  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm">
      <p className="mb-2 font-medium text-zinc-700">
        Usa tu propia API key (opcional)
      </p>
      <input
        type="password"
        value={value}
        onChange={handleChange}
        placeholder="sk-... / sk-ant-... / AIza..."
        className="w-full rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-700"
      />
      {detected && (
        <p className="mt-1.5 text-xs text-zinc-500">
          Detectado: <span className="font-medium text-zinc-700">{label[detected]}</span> — tus llamadas van directo al proveedor.
        </p>
      )}
      {value && !detected && (
        <p className="mt-1.5 text-xs text-red-500">
          Prefijo no reconocido. Soportado: OpenAI (sk-), Anthropic (sk-ant-), Gemini (AIza/AQ.).
        </p>
      )}
    </div>
  );
}
