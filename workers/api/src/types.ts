export interface Bindings {
  DB: D1Database;
  ENVIRONMENT: string;
  OPENAI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
}

export interface Variables {
  userId?: string;
  requestId: string;
}
