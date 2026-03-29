-- ============================================================
-- 完全セットアップ: DROP → CREATE → INSERT
-- 既存テーブルをすべて削除して正しいスキーマで作り直す
-- ============================================================

-- 依存関係の逆順で DROP
DROP TABLE IF EXISTS public.quiz_answers CASCADE;
DROP TABLE IF EXISTS public.quiz_sessions CASCADE;
DROP TABLE IF EXISTS public.conversation_messages CASCADE;
DROP TABLE IF EXISTS public.conversation_sessions CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badge_definitions CASCADE;
DROP TABLE IF EXISTS public.daily_activity CASCADE;
DROP TABLE IF EXISTS public.vocabulary_progress CASCADE;
DROP TABLE IF EXISTS public.character_progress CASCADE;
DROP TABLE IF EXISTS public.vocabulary CASCADE;
DROP TABLE IF EXISTS public.hangul_characters CASCADE;

-- トリガー・関数も再作成できるよう DROP
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.record_activity(UUID, INTEGER, INTEGER);

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- HANGUL CHARACTERS
-- ============================================================
CREATE TABLE public.hangul_characters (
  id              SERIAL PRIMARY KEY,
  character       TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL CHECK (type IN ('consonant','vowel')),
  romanization    TEXT NOT NULL,
  pronunciation_jp TEXT NOT NULL,
  stroke_count    INTEGER NOT NULL,
  audio_url       TEXT,
  examples        JSONB,
  position        INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VOCABULARY / WORDS
-- ============================================================
CREATE TABLE public.vocabulary (
  id              SERIAL PRIMARY KEY,
  korean          TEXT NOT NULL,
  romanization    TEXT NOT NULL,
  japanese        TEXT NOT NULL,
  english         TEXT,
  category        TEXT NOT NULL,
  difficulty      SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  audio_url       TEXT,
  example_sentence_ko  TEXT,
  example_sentence_jp  TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEARNING PROGRESS — PER USER, PER CHARACTER
-- ============================================================
CREATE TABLE public.character_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  character_id    INTEGER NOT NULL REFERENCES public.hangul_characters(id),
  mastery_level   SMALLINT NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  correct_count   INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  next_review_at  TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id, character_id)
);
ALTER TABLE public.character_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own character progress"
  ON public.character_progress FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- VOCABULARY PROGRESS
-- ============================================================
CREATE TABLE public.vocabulary_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vocabulary_id   INTEGER NOT NULL REFERENCES public.vocabulary(id),
  box_number      SMALLINT NOT NULL DEFAULT 0,
  correct_count   INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  next_review_at  TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id, vocabulary_id)
);
ALTER TABLE public.vocabulary_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vocab progress"
  ON public.vocabulary_progress FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- QUIZ SESSIONS & RESULTS
-- ============================================================
CREATE TABLE public.quiz_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_type       TEXT NOT NULL CHECK (quiz_type IN ('multiple_choice','input','mixed')),
  scope           TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own quiz sessions"
  ON public.quiz_sessions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.quiz_answers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_ref_type TEXT NOT NULL CHECK (question_ref_type IN ('hangul','vocabulary')),
  question_ref_id INTEGER NOT NULL,
  user_answer     TEXT NOT NULL,
  correct_answer  TEXT NOT NULL,
  is_correct      BOOLEAN NOT NULL,
  response_ms     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONVERSATION HISTORY
-- ============================================================
CREATE TABLE public.conversation_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT,
  scenario        TEXT,
  message_count   INTEGER NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations"
  ON public.conversation_sessions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.conversation_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content         TEXT NOT NULL,
  corrections     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON public.conversation_messages(session_id, created_at);

-- ============================================================
-- BADGES / ACHIEVEMENTS
-- ============================================================
CREATE TABLE public.badge_definitions (
  id          SERIAL PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,
  name_jp     TEXT NOT NULL,
  description_jp TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '🏆',
  xp_reward   INTEGER NOT NULL DEFAULT 0,
  condition   JSONB NOT NULL
);

CREATE TABLE public.user_badges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id        INTEGER NOT NULL REFERENCES public.badge_definitions(id),
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own badges"
  ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own badges"
  ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DAILY ACTIVITY LOG
-- ============================================================
CREATE TABLE public.daily_activity (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  xp_earned   INTEGER NOT NULL DEFAULT 0,
  minutes_studied INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, activity_date)
);
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own activity"
  ON public.daily_activity FOR ALL USING (auth.uid() = user_id);

-- Helper function
CREATE OR REPLACE FUNCTION public.record_activity(
  p_user_id UUID, p_xp INTEGER, p_minutes INTEGER
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.daily_activity (user_id, activity_date, xp_earned, minutes_studied)
  VALUES (p_user_id, CURRENT_DATE, p_xp, p_minutes)
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    xp_earned = daily_activity.xp_earned + EXCLUDED.xp_earned,
    minutes_studied = daily_activity.minutes_studied + EXCLUDED.minutes_studied;

  UPDATE public.profiles
  SET xp_total = xp_total + p_xp, last_studied = CURRENT_DATE
  WHERE id = p_user_id;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ハングル文字データ
-- ============================================================
INSERT INTO public.hangul_characters (character, type, romanization, pronunciation_jp, stroke_count, position, examples)
VALUES
  ('ㄱ', 'consonant', 'g/k', 'カ行', 2, 1, '[{"word":"가방","reading":"가방","meaning":"カバン"},{"word":"기차","reading":"기차","meaning":"汽車"}]'),
  ('ㄴ', 'consonant', 'n', 'ナ行', 2, 2, '[{"word":"나무","reading":"나무","meaning":"木"},{"word":"노래","reading":"노래","meaning":"歌"}]'),
  ('ㄷ', 'consonant', 'd/t', 'タ行', 3, 3, '[{"word":"다리","reading":"다리","meaning":"橋・足"},{"word":"도시","reading":"도시","meaning":"都市"}]'),
  ('ㄹ', 'consonant', 'r/l', 'ラ行', 5, 4, '[{"word":"라면","reading":"라면","meaning":"ラーメン"},{"word":"로봇","reading":"로봇","meaning":"ロボット"}]'),
  ('ㅁ', 'consonant', 'm', 'マ行', 4, 5, '[{"word":"마음","reading":"마음","meaning":"心"},{"word":"물","reading":"물","meaning":"水"}]'),
  ('ㅂ', 'consonant', 'b/p', 'パ行', 4, 6, '[{"word":"바다","reading":"바다","meaning":"海"},{"word":"빵","reading":"빵","meaning":"パン"}]'),
  ('ㅅ', 'consonant', 's', 'サ行', 2, 7, '[{"word":"사랑","reading":"사랑","meaning":"愛"},{"word":"사과","reading":"사과","meaning":"リンゴ"}]'),
  ('ㅇ', 'consonant', 'ng/silent', '無音/ング', 1, 8, '[{"word":"아이","reading":"아이","meaning":"子供"},{"word":"이름","reading":"이름","meaning":"名前"}]'),
  ('ㅈ', 'consonant', 'j', 'チャ行', 3, 9, '[{"word":"자동차","reading":"자동차","meaning":"自動車"},{"word":"주스","reading":"주스","meaning":"ジュース"}]'),
  ('ㅊ', 'consonant', 'ch', 'チャ行（強）', 3, 10, '[{"word":"차","reading":"차","meaning":"車・お茶"},{"word":"청소","reading":"청소","meaning":"掃除"}]'),
  ('ㅋ', 'consonant', 'k', 'カ行（強）', 3, 11, '[{"word":"카메라","reading":"카메라","meaning":"カメラ"},{"word":"커피","reading":"커피","meaning":"コーヒー"}]'),
  ('ㅌ', 'consonant', 't', 'タ行（強）', 3, 12, '[{"word":"타다","reading":"타다","meaning":"乗る"},{"word":"토마토","reading":"토마토","meaning":"トマト"}]'),
  ('ㅍ', 'consonant', 'p', 'パ行（強）', 4, 13, '[{"word":"파티","reading":"파티","meaning":"パーティー"},{"word":"피자","reading":"피자","meaning":"ピザ"}]'),
  ('ㅎ', 'consonant', 'h', 'ハ行', 3, 14, '[{"word":"하늘","reading":"하늘","meaning":"空"},{"word":"한국","reading":"한국","meaning":"韓国"}]'),
  ('ㅏ', 'vowel', 'a', 'ア', 2, 15, '[{"word":"아버지","reading":"아버지","meaning":"お父さん"},{"word":"아침","reading":"아침","meaning":"朝"}]'),
  ('ㅑ', 'vowel', 'ya', 'ヤ', 3, 16, '[{"word":"야구","reading":"야구","meaning":"野球"},{"word":"야채","reading":"야채","meaning":"野菜"}]'),
  ('ㅓ', 'vowel', 'eo', 'オ（短め）', 2, 17, '[{"word":"어머니","reading":"어머니","meaning":"お母さん"},{"word":"언니","reading":"언니","meaning":"お姉さん（女性から）"}]'),
  ('ㅕ', 'vowel', 'yeo', 'ヨ', 3, 18, '[{"word":"여자","reading":"여자","meaning":"女性"},{"word":"여름","reading":"여름","meaning":"夏"}]'),
  ('ㅗ', 'vowel', 'o', 'オ', 2, 19, '[{"word":"오빠","reading":"오빠","meaning":"お兄さん（女性から）"},{"word":"오늘","reading":"오늘","meaning":"今日"}]'),
  ('ㅛ', 'vowel', 'yo', 'ヨ', 3, 20, '[{"word":"요리","reading":"요리","meaning":"料理"},{"word":"요즘","reading":"요즘","meaning":"最近"}]'),
  ('ㅜ', 'vowel', 'u', 'ウ', 2, 21, '[{"word":"우유","reading":"우유","meaning":"牛乳"},{"word":"우리","reading":"우리","meaning":"私たち"}]'),
  ('ㅠ', 'vowel', 'yu', 'ユ', 3, 22, '[{"word":"유리","reading":"유리","meaning":"ガラス"},{"word":"유행","reading":"유행","meaning":"流行"}]'),
  ('ㅡ', 'vowel', 'eu', 'ウ（口を広げて）', 1, 23, '[{"word":"그림","reading":"그림","meaning":"絵"},{"word":"흐리다","reading":"흐리다","meaning":"曇る"}]'),
  ('ㅣ', 'vowel', 'i', 'イ', 1, 24, '[{"word":"이","reading":"이","meaning":"この・歯"},{"word":"이야기","reading":"이야기","meaning":"話"}]');

-- ============================================================
-- 単語データ
-- ============================================================
INSERT INTO public.vocabulary (korean, romanization, japanese, english, category, difficulty, example_sentence_ko, example_sentence_jp)
VALUES
  ('안녕하세요', 'annyeonghaseyo', 'こんにちは／こんばんは／おはようございます', 'Hello', 'greetings', 1, '안녕하세요! 처음 뵙겠습니다.', 'こんにちは！はじめまして。'),
  ('안녕히 가세요', 'annyeonghi gaseyo', 'さようなら（去る人へ）', 'Goodbye (to the one leaving)', 'greetings', 1, '안녕히 가세요!', 'さようなら！'),
  ('안녕히 계세요', 'annyeonghi gyeseyo', 'さようなら（残る人へ）', 'Goodbye (to the one staying)', 'greetings', 1, '안녕히 계세요!', 'ごきげんよう！'),
  ('감사합니다', 'gamsahamnida', 'ありがとうございます', 'Thank you', 'greetings', 1, '도와주셔서 감사합니다.', '助けてくださってありがとうございます。'),
  ('죄송합니다', 'joesonghamnida', '申し訳ございません', 'I am sorry', 'greetings', 1, '늦어서 죄송합니다.', '遅くなって申し訳ございません。'),
  ('괜찮아요', 'gwaenchanayo', '大丈夫です', 'It''s okay', 'greetings', 1, '괜찮아요? 네, 괜찮아요.', '大丈夫ですか？ はい、大丈夫です。'),
  ('처음 뵙겠습니다', 'cheoeum boepgesseumnida', 'はじめまして', 'Nice to meet you', 'greetings', 2, '처음 뵙겠습니다. 잘 부탁드립니다.', 'はじめまして。よろしくお願いします。'),
  ('잘 부탁드립니다', 'jal butakdeurimnida', 'よろしくお願いします', 'Please take care of me', 'greetings', 2, '앞으로 잘 부탁드립니다.', 'これからよろしくお願いします。'),
  ('일', 'il', '一（漢数詞）', 'One (Sino-Korean)', 'numbers', 1, '일 년은 열두 달이에요.', '一年は十二ヶ月です。'),
  ('이', 'i', '二（漢数詞）', 'Two (Sino-Korean)', 'numbers', 1, '이 층에 있어요.', '二階にあります。'),
  ('삼', 'sam', '三（漢数詞）', 'Three (Sino-Korean)', 'numbers', 1, '삼 분 후에 만나요.', '三分後に会いましょう。'),
  ('사', 'sa', '四（漢数詞）', 'Four (Sino-Korean)', 'numbers', 1, '사 시에 와요.', '四時に来てください。'),
  ('오', 'o', '五（漢数詞）', 'Five (Sino-Korean)', 'numbers', 1, '오 월에 여행가요.', '五月に旅行します。'),
  ('육', 'yuk', '六（漢数詞）', 'Six (Sino-Korean)', 'numbers', 1, '육 개월이 지났어요.', '六ヶ月が経ちました。'),
  ('칠', 'chil', '七（漢数詞）', 'Seven (Sino-Korean)', 'numbers', 1, '칠 월은 여름이에요.', '七月は夏です。'),
  ('팔', 'pal', '八（漢数詞）', 'Eight (Sino-Korean)', 'numbers', 1, '팔 시에 일어나요.', '八時に起きます。'),
  ('구', 'gu', '九（漢数詞）', 'Nine (Sino-Korean)', 'numbers', 1, '구 월에 학교가 시작해요.', '九月に学校が始まります。'),
  ('십', 'sip', '十（漢数詞）', 'Ten (Sino-Korean)', 'numbers', 1, '십 원이에요.', '十ウォンです。'),
  ('하나', 'hana', '一つ（固有数詞）', 'One (native Korean)', 'numbers', 2, '하나 주세요.', '一つください。'),
  ('둘', 'dul', '二つ（固有数詞）', 'Two (native Korean)', 'numbers', 2, '둘 있어요.', '二つあります。'),
  ('셋', 'set', '三つ（固有数詞）', 'Three (native Korean)', 'numbers', 2, '셋 다 주세요.', '三つ全部ください。'),
  ('밥', 'bap', 'ご飯・食事', 'Rice/meal', 'food', 1, '밥 먹었어요?', 'ご飯食べましたか？'),
  ('물', 'mul', '水', 'Water', 'food', 1, '물 한 잔 주세요.', '水を一杯ください。'),
  ('커피', 'keopi', 'コーヒー', 'Coffee', 'food', 1, '커피 한 잔 마실게요.', 'コーヒーを一杯飲みます。'),
  ('차', 'cha', 'お茶', 'Tea', 'food', 1, '녹차 마실래요?', '緑茶を飲みますか？'),
  ('빵', 'ppang', 'パン', 'Bread', 'food', 1, '아침에 빵을 먹어요.', '朝にパンを食べます。'),
  ('고기', 'gogi', '肉', 'Meat', 'food', 1, '삼겹살은 돼지고기예요.', 'サムギョプサルは豚肉です。'),
  ('생선', 'saengseon', '魚', 'Fish', 'food', 2, '생선회가 맛있어요.', '刺身がおいしいです。'),
  ('김치', 'gimchi', 'キムチ', 'Kimchi', 'food', 1, '한국에서는 매일 김치를 먹어요.', '韓国では毎日キムチを食べます。'),
  ('라면', 'ramyeon', 'ラーメン', 'Ramen', 'food', 1, '라면 끓여 먹을까요?', 'ラーメンを作って食べましょうか？'),
  ('비빔밥', 'bibimbap', 'ビビンバ', 'Bibimbap', 'food', 2, '비빔밥은 건강에 좋아요.', 'ビビンバは健康に良いです。'),
  ('네', 'ne', 'はい', 'Yes', 'daily', 1, '네, 알겠습니다.', 'はい、わかりました。'),
  ('아니요', 'aniyo', 'いいえ', 'No', 'daily', 1, '아니요, 괜찮아요.', 'いいえ、大丈夫です。'),
  ('이거', 'igeo', 'これ', 'This', 'daily', 1, '이거 얼마예요?', 'これはいくらですか？'),
  ('저거', 'jeogeo', 'あれ', 'That', 'daily', 1, '저거 뭐예요?', 'あれは何ですか？'),
  ('좋아요', 'joayo', 'いいです・好きです', 'Good/I like it', 'daily', 1, '이 음악 좋아요.', 'この音楽、好きです。'),
  ('싫어요', 'sireoyo', '嫌です・嫌いです', 'I don''t like it', 'daily', 2, '매운 음식 싫어요.', '辛い食べ物が嫌いです。'),
  ('맛있어요', 'massisseoyo', 'おいしいです', 'It''s delicious', 'daily', 1, '정말 맛있어요!', '本当においしいです！'),
  ('비싸요', 'bissayo', '高いです（値段）', 'It''s expensive', 'daily', 2, '너무 비싸요.', 'とても高いです。'),
  ('싸요', 'ssayo', '安いです（値段）', 'It''s cheap', 'daily', 2, '많이 싸요.', 'とても安いです。'),
  ('어디에 있어요?', 'eodie isseoyo?', 'どこにありますか？', 'Where is it?', 'daily', 2, '화장실이 어디에 있어요?', 'トイレはどこにありますか？'),
  ('공항', 'gonghang', '空港', 'Airport', 'travel', 2, '공항에 어떻게 가요?', '空港にはどうやって行きますか？'),
  ('기차역', 'gichayeok', '駅', 'Train station', 'travel', 2, '기차역이 어디예요?', '駅はどこですか？'),
  ('지하철', 'jihacheol', '地下鉄', 'Subway', 'travel', 2, '지하철을 타세요.', '地下鉄に乗ってください。'),
  ('버스', 'beoseu', 'バス', 'Bus', 'travel', 1, '버스 몇 번이에요?', 'バスは何番ですか？'),
  ('택시', 'taeksi', 'タクシー', 'Taxi', 'travel', 1, '택시 불러 주세요.', 'タクシーを呼んでください。'),
  ('호텔', 'hotel', 'ホテル', 'Hotel', 'travel', 1, '호텔을 예약했어요.', 'ホテルを予約しました。'),
  ('여권', 'yeokwon', 'パスポート', 'Passport', 'travel', 2, '여권을 가져오세요.', 'パスポートを持ってきてください。'),
  ('관광지', 'gwangwangji', '観光地', 'Tourist spot', 'travel', 3, '관광지를 추천해 주세요.', '観光地を紹介してください。');

-- ============================================================
-- バッジ定義データ
-- ============================================================
INSERT INTO public.badge_definitions (key, name_jp, description_jp, icon, xp_reward, condition)
VALUES
  ('first_login', 'はじめの一歩', 'アプリに初めてログインした', '🐣', 10, '{"type":"login_count","value":1}'),
  ('first_quiz', '初クイズ', '最初のクイズを完了した', '📝', 20, '{"type":"quiz_count","value":1}'),
  ('streak_3', '3日連続', '3日連続で学習した', '🔥', 30, '{"type":"streak","value":3}'),
  ('streak_7', '1週間継続', '7日連続で学習した', '⚡', 70, '{"type":"streak","value":7}'),
  ('streak_30', '1ヶ月継続', '30日連続で学習した', '💎', 300, '{"type":"streak","value":30}'),
  ('consonants_complete', '子音マスター', 'すべての基本子音を学習した', '🎵', 50, '{"type":"hangul_type_complete","value":"consonant"}'),
  ('vowels_complete', '母音マスター', 'すべての基本母音を学習した', '🎶', 50, '{"type":"hangul_type_complete","value":"vowel"}'),
  ('hangul_complete', 'ハングル完全習得', 'すべてのハングル文字を学習した', '🏆', 100, '{"type":"hangul_all_complete","value":true}'),
  ('quiz_100', '100問達成', 'クイズに合計100問正解した', '💯', 100, '{"type":"total_correct","value":100}'),
  ('vocab_50', '単語博士', '50個の単語を習得した', '📚', 50, '{"type":"vocab_mastered","value":50}'),
  ('first_conversation', 'AI会話デビュー', 'AI会話練習を初めて行った', '💬', 30, '{"type":"conversation_count","value":1}'),
  ('xp_500', '学習熱心', 'XPを500獲得した', '⭐', 50, '{"type":"xp_total","value":500}');
