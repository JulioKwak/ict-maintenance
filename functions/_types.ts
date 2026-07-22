export interface Env {
  DB: D1Database
  FILES: R2Bucket
  OPENAI_API_KEY: string
  NAVER_CLIENT_ID: string
  NAVER_CLIENT_SECRET: string
  ASSETS: Fetcher
}

export interface Data {
  username?: string
}
