export interface Bindings {
  DB: D1Database;
  ENVIRONMENT: string;
  OPENAI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  OPENPAGERANK_API_KEY?: string;
  FREE_AI_ENDPOINT_URL?: string;
  FREE_AI_API_KEY?: string;
  FREE_AI_MODEL?: string;
}

export interface Variables {
  userId?: string;
  authMethod?: 'session' | 'api_key';
  requestId: string;
}
