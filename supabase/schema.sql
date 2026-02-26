-- =============================================
-- 라켓포올 (Racket For All) Database Schema
-- Supabase SQL Editor에서 실행
-- =============================================

-- 동호회
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  phone TEXT,
  profile_image TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('platform_admin', 'club_admin', 'member')),
  club_id UUID REFERENCES clubs(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 초대코드
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  club_id UUID REFERENCES clubs(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('club_admin', 'member')),
  max_uses INT DEFAULT 50,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 일정/이벤트
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  court_info TEXT,
  game_type TEXT,
  max_participants INT,
  image_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 기존 events 테이블에 image_url 컬럼 추가 (이미 테이블이 있는 경우)
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 일정 참석 여부
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('attending', 'waiting')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 게시글
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'review', 'community')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 댓글
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 좋아요
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_club_id ON users(club_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_club_id ON posts(club_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- =============================================
-- 초기 데이터 (테스트용)
-- =============================================
INSERT INTO clubs (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000001', '테리니 테니스 동호회', '기흥지역 테니스 동호회')
ON CONFLICT DO NOTHING;

INSERT INTO invite_codes (code, club_id, role, max_uses) VALUES
  ('RACKET2026', '00000000-0000-0000-0000-000000000001', 'member', 100)
ON CONFLICT DO NOTHING;

-- =============================================
-- 프로필 확장 필드 (기존 users 테이블에 추가)
-- =============================================
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS tennis_start_date DATE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS ntrp_level TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- =============================================
-- Supabase Storage 설정 (대시보드에서 수동 설정 필요)
-- =============================================
-- 1. Supabase Dashboard > Storage 에서 'event-images' 버킷 생성
-- 2. 버킷을 Public 으로 설정
-- 3. 아래 RLS 정책 추가:
--    - SELECT: 모든 사용자 허용 (public)
--    - INSERT: 인증된 사용자만 허용
--    - DELETE: 파일 소유자만 허용
