export * from "./medical";

export interface UserSession {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

export type TimeRange = "7d" | "30d" | "3m" | "6m" | "1y" | "all";
