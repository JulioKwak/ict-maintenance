export interface Env {
  DB: D1Database
  FILES: R2Bucket
  OPENAI_API_KEY: string
  LOCAL_SEARCH_ID: string
  LOCAL_SEARCH_SECRET: string
  ASSETS: Fetcher
}

export interface Data {
  username?: string
}
