"use client";

import { useCallback, useState } from "react";

export function useModelDiscovery({ modelsApiUrl }: { modelsApiUrl: string }) {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const discover = useCallback(async (endpointUrl: string, apiKey: string) => {
    setLoading(true);
    try {
      const response = await fetch(modelsApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointUrl, apiKey }),
      });
      const payload = await response.json() as { models?: string[]; error?: string };
      if (!response.ok) throw new Error(payload.error || `Model discovery failed with HTTP ${response.status}`);
      setModels(payload.models ?? []);
    } finally {
      setLoading(false);
    }
  }, [modelsApiUrl]);

  return { models, loading, discover };
}
