/**
 * Type ของฐานข้อมูล (เขียนมือแบบย่อ)
 * ใน production แนะนำ generate อัตโนมัติด้วย:
 *   supabase gen types typescript --local > lib/database.types.ts
 */

export type Role = "member" | "editor" | "admin";
export type ContentStatus = "published" | "hidden" | "deleted";
export type NewsStatus = "draft" | "pending" | "published" | "archived";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  province_id: number | null;
  role: Role;
  reputation: number;
  level_id: number;
  created_at: string;
  updated_at: string;
}

export interface Province {
  id: number;
  name_th: string;
  name_en: string | null;
  slug: string;
  is_active: boolean;
}

export interface MembershipLevel {
  id: number;
  name_th: string;
  name_en: string;
  min_points: number;
  perks: Record<string, unknown>;
}

export interface Category {
  id: number;
  name_th: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Thread {
  id: number;
  author_id: string;
  category_id: number;
  province_id: number | null;
  title: string;
  body: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  like_count: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface News {
  id: number;
  author_id: string;
  province_id: number | null;
  category: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  is_featured: boolean;
  status: NewsStatus;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  created_at: string;
}

/** placeholder generic — ใช้ร่วมกับ supabase-js เพื่อ type ขั้นต้น */
export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Functions: Record<string, unknown>;
  };
};
