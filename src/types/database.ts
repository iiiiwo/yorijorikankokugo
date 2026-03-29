export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          native_lang: string;
          level: "beginner" | "intermediate" | "advanced";
          xp_total: number;
          streak_days: number;
          last_studied: string | null;
          daily_goal_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          native_lang?: string;
          level?: "beginner" | "intermediate" | "advanced";
          xp_total?: number;
          streak_days?: number;
          last_studied?: string | null;
          daily_goal_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          native_lang?: string;
          level?: "beginner" | "intermediate" | "advanced";
          xp_total?: number;
          streak_days?: number;
          last_studied?: string | null;
          daily_goal_minutes?: number;
          updated_at?: string;
        };
      };
      hangul_characters: {
        Row: {
          id: number;
          character: string;
          type: "consonant" | "vowel";
          romanization: string;
          pronunciation_jp: string;
          stroke_count: number;
          audio_url: string | null;
          examples: Json | null;
          position: number;
          created_at: string;
        };
        Insert: {
          character: string;
          type: "consonant" | "vowel";
          romanization: string;
          pronunciation_jp: string;
          stroke_count: number;
          audio_url?: string | null;
          examples?: Json | null;
          position: number;
        };
        Update: {
          character?: string;
          type?: "consonant" | "vowel";
          romanization?: string;
          pronunciation_jp?: string;
          stroke_count?: number;
          audio_url?: string | null;
          examples?: Json | null;
          position?: number;
        };
      };
      vocabulary: {
        Row: {
          id: number;
          korean: string;
          romanization: string;
          japanese: string;
          english: string | null;
          category: string;
          difficulty: number;
          audio_url: string | null;
          example_sentence_ko: string | null;
          example_sentence_jp: string | null;
          tags: string[] | null;
          created_at: string;
        };
        Insert: {
          korean: string;
          romanization: string;
          japanese: string;
          english?: string | null;
          category: string;
          difficulty?: number;
          audio_url?: string | null;
          example_sentence_ko?: string | null;
          example_sentence_jp?: string | null;
          tags?: string[] | null;
        };
        Update: {
          korean?: string;
          romanization?: string;
          japanese?: string;
          english?: string | null;
          category?: string;
          difficulty?: number;
          audio_url?: string | null;
          example_sentence_ko?: string | null;
          example_sentence_jp?: string | null;
          tags?: string[] | null;
        };
      };
      character_progress: {
        Row: {
          id: string;
          user_id: string;
          character_id: number;
          mastery_level: number;
          correct_count: number;
          incorrect_count: number;
          next_review_at: string | null;
          last_reviewed_at: string | null;
        };
        Insert: {
          user_id: string;
          character_id: number;
          mastery_level?: number;
          correct_count?: number;
          incorrect_count?: number;
          next_review_at?: string | null;
          last_reviewed_at?: string | null;
        };
        Update: {
          mastery_level?: number;
          correct_count?: number;
          incorrect_count?: number;
          next_review_at?: string | null;
          last_reviewed_at?: string | null;
        };
      };
      vocabulary_progress: {
        Row: {
          id: string;
          user_id: string;
          vocabulary_id: number;
          box_number: number;
          correct_count: number;
          incorrect_count: number;
          next_review_at: string | null;
          last_reviewed_at: string | null;
        };
        Insert: {
          user_id: string;
          vocabulary_id: number;
          box_number?: number;
          correct_count?: number;
          incorrect_count?: number;
          next_review_at?: string | null;
          last_reviewed_at?: string | null;
        };
        Update: {
          box_number?: number;
          correct_count?: number;
          incorrect_count?: number;
          next_review_at?: string | null;
          last_reviewed_at?: string | null;
        };
      };
      quiz_sessions: {
        Row: {
          id: string;
          user_id: string;
          quiz_type: "multiple_choice" | "input" | "mixed";
          scope: string;
          total_questions: number;
          correct_answers: number;
          xp_earned: number;
          duration_seconds: number | null;
          completed_at: string;
        };
        Insert: {
          user_id: string;
          quiz_type: "multiple_choice" | "input" | "mixed";
          scope: string;
          total_questions: number;
          correct_answers?: number;
          xp_earned?: number;
          duration_seconds?: number | null;
          completed_at?: string;
        };
        Update: {
          correct_answers?: number;
          xp_earned?: number;
          duration_seconds?: number | null;
        };
      };
      conversation_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          scenario: string | null;
          message_count: number;
          started_at: string;
          last_message_at: string;
        };
        Insert: {
          user_id: string;
          title?: string | null;
          scenario?: string | null;
          message_count?: number;
          started_at?: string;
          last_message_at?: string;
        };
        Update: {
          title?: string | null;
          scenario?: string | null;
          message_count?: number;
          last_message_at?: string;
        };
      };
      conversation_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          corrections: Json | null;
          created_at: string;
        };
        Insert: {
          session_id: string;
          role: "user" | "assistant";
          content: string;
          corrections?: Json | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          corrections?: Json | null;
        };
      };
      badge_definitions: {
        Row: {
          id: number;
          key: string;
          name_jp: string;
          description_jp: string;
          icon: string;
          xp_reward: number;
          condition: Json;
        };
        Insert: {
          key: string;
          name_jp: string;
          description_jp: string;
          icon?: string;
          xp_reward?: number;
          condition: Json;
        };
        Update: {
          name_jp?: string;
          description_jp?: string;
          icon?: string;
          xp_reward?: number;
          condition?: Json;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: number;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: number;
          earned_at?: string;
        };
        Update: Record<string, never>;
      };
      daily_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          xp_earned: number;
          minutes_studied: number;
        };
        Insert: {
          user_id: string;
          activity_date: string;
          xp_earned?: number;
          minutes_studied?: number;
        };
        Update: {
          xp_earned?: number;
          minutes_studied?: number;
        };
      };
    };
    Functions: {
      record_activity: {
        Args: { p_user_id: string; p_xp: number; p_minutes: number };
        Returns: void;
      };
    };
  };
}
