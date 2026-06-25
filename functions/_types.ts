export interface Env {
  DB: D1Database
  OPENAI_API_KEY: string
  ASSETS: Fetcher
}

export interface Data {
  username?: string
}
