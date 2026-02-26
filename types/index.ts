// ===== Database Types =====

export type UserRole = "platform_admin" | "club_admin" | "member";
export type RsvpStatus = "attending" | "waiting";
export type PostType = "announcement" | "review" | "community";
export type GameType = "rally" | "singles" | "doubles" | "mixed_doubles";

export interface Club {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  profile_image: string | null;
  role: UserRole;
  club_id: string | null;
  password_hash: string | null;
  gender: "male" | "female" | null;
  tennis_start_date: string | null;
  ntrp_level: string | null;
  bio: string | null;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  club_id: string;
  role: "club_admin" | "member";
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  club?: Club;
}

export interface Event {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  court_info: string | null;
  game_type: string | null;
  max_participants: number | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  // Joined fields
  creator?: Pick<User, "id" | "name" | "nickname" | "profile_image">;
  rsvps?: EventRsvp[];
  attending_count?: number;
  waiting_count?: number;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  created_at: string;
  user?: Pick<User, "id" | "name" | "nickname" | "profile_image">;
}

export interface Post {
  id: string;
  club_id: string;
  author_id: string;
  type: PostType;
  title: string;
  content: string;
  image_urls: string[] | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Pick<User, "id" | "name" | "nickname" | "profile_image">;
  comments_count?: number;
  likes_count?: number;
  is_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Pick<User, "id" | "name" | "nickname" | "profile_image">;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// ===== Form Types =====

export interface RegisterFormData {
  inviteCode: string;
  email: string;
  password: string;
  name: string;
  nickname: string;
  phone: string;
}

export interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  court_info: string;
  game_type: string;
  max_participants: number | null;
}

export interface PostFormData {
  type: PostType;
  title: string;
  content: string;
  image_urls?: string[];
}

// ===== API Response Types =====

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===== Ranking Types =====

export interface RankingEntry {
  user_id: string;
  name: string;
  nickname: string | null;
  profile_image: string | null;
  attendance_count: number;
  rank: number;
}
