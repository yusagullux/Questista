// Database row types (kept in sync with supabase/migrations/0001_init.sql).

export type AnswerVisibility = "public" | "private" | "skipped";
export type QuestionStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "used"
  | "rejected";
export type QuestionCategory =
  | "fun"
  | "life"
  | "creativity"
  | "school"
  | "technology"
  | "future"
  | "opinions"
  | "hypotheticals"
  | "random"
  | "personal_growth";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  confidence_points: number;
  confidence_level: string;
  answers_count: number;
  public_answers_count: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  prompt: string;
  category: QuestionCategory;
  status: QuestionStatus;
  source: string;
  scheduled_date: string | null;
  model: string | null;
  created_at: string;
  published_at: string | null;
}

export interface Answer {
  id: string;
  user_id: string;
  question_id: string;
  content: string | null;
  visibility: AnswerVisibility;
  created_at: string;
  updated_at: string;
}

/** Answer joined with its author profile + reaction counts, as returned by the feed query. */
export interface FeedAnswer extends Answer {
  profiles: Pick<
    Profile,
    "id" | "username" | "display_name" | "avatar_url" | "confidence_level"
  > | null;
  reaction_count: number;
  viewer_reacted: boolean;
}