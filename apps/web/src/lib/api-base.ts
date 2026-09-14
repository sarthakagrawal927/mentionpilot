export const API_BASE = process.env.NEXT_PUBLIC_API_URL || (
  process.env.NODE_ENV === "production"
    ? "https://mentionpilot-api.sarthakagrawal927.workers.dev"
    : "http://localhost:8787"
);
