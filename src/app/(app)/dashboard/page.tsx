import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [p1, p2, p3, p4, p5, p6, p7] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("quiz_sessions")
      .select("scope, correct_answers, total_questions, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(3),
    supabase
      .from("daily_activity")
      .select("activity_date, xp_earned, minutes_studied")
      .eq("user_id", user.id)
      .order("activity_date", { ascending: false })
      .limit(7),
    supabase.from("hangul_characters").select("id"),
    supabase.from("character_progress").select("mastery_level").eq("user_id", user.id),
    supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", user.id),
    supabase.from("badge_definitions").select("id, icon, name_jp").limit(6),
  ]);
  type ProfileRow = { display_name: string | null; username: string | null; streak_days: number; xp_total: number; daily_goal_minutes: number };
  const profile = p1.data as ProfileRow | null;
  const recentQuizzes = p2.data as { scope: string; correct_answers: number; total_questions: number; completed_at: string }[] | null;
  const recentActivity = p3.data as { activity_date: string; xp_earned: number; minutes_studied: number }[] | null;
  const charCount = p4.data as { id: number }[] | null;
  const charProgress = p5.data as { mastery_level: number }[] | null;
  const badges = p6.data as { badge_id: number; earned_at: string }[] | null;
  const badgeDefs = p7.data as { id: number; icon: string; name_jp: string }[] | null;

  const totalChars = charCount?.length ?? 24;
  const learnedChars = (charProgress ?? []).filter((p) => p.mastery_level >= 1).length;
  const hangulProgress = Math.round((learnedChars / totalChars) * 100);
  const earnedBadgeIds = new Set((badges ?? []).map((b) => b.badge_id));

  const todayActivity = recentActivity?.[0];
  const todayXp = todayActivity?.xp_earned ?? 0;
  const todayMinutes = todayActivity?.minutes_studied ?? 0;

  const quickLinks = [
    { href: "/hangul", icon: "한", label: "ハングル学習", color: "bg-blue-500" },
    { href: "/quiz", icon: "📝", label: "クイズ", color: "bg-green-500" },
    { href: "/conversation", icon: "💬", label: "AI会話", color: "bg-purple-500" },
    { href: "/vocabulary", icon: "📚", label: "単語帳", color: "bg-orange-500" },
  ];

  function getScopeLabel(scope: string) {
    const labels: Record<string, string> = {
      hangul_consonants: "子音クイズ",
      hangul_vowels: "母音クイズ",
      hangul_all: "総合ハングル",
      vocab_greetings: "挨拶",
      vocab_food: "食べ物",
      vocab_daily: "日常表現",
      vocab_travel: "旅行",
    };
    return labels[scope] ?? scope;
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-korean-red to-red-700 text-white rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-red-100 text-sm mb-1">おかえりなさい！</p>
            <h1 className="text-2xl font-bold">
              {profile?.display_name ?? profile?.username ?? user.email?.split("@")[0] ?? "ゲスト"}さん
            </h1>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🔥</span>
                <span className="font-bold">{profile?.streak_days ?? 0}日連続</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl">⭐</span>
                <span className="font-bold">{profile?.xp_total ?? 0} XP</span>
              </div>
            </div>
          </div>
          <div className="text-6xl opacity-20 hangul-char font-black">안</div>
        </div>
      </div>

      {/* Today's progress */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-korean-gold">{todayXp}</p>
          <p className="text-sm text-gray-400 mt-1">今日のXP</p>
          <div className="mt-3">
            <ProgressBar value={todayXp} max={100} color="gold" />
            <p className="text-xs text-gray-400 mt-1">目標: 100 XP</p>
          </div>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-korean-blue">{todayMinutes}</p>
          <p className="text-sm text-gray-400 mt-1">今日の学習（分）</p>
          <div className="mt-3">
            <ProgressBar value={todayMinutes} max={profile?.daily_goal_minutes ?? 15} color="blue" />
            <p className="text-xs text-gray-400 mt-1">目標: {profile?.daily_goal_minutes ?? 15}分</p>
          </div>
        </div>
      </div>

      {/* Hangul progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-700">ハングル習得状況</h2>
          <Link href="/hangul" className="text-sm text-korean-red hover:underline">
            全文字を見る →
          </Link>
        </div>
        <ProgressBar value={learnedChars} max={totalChars} color="red" className="mb-2" />
        <p className="text-sm text-gray-500">
          {learnedChars} / {totalChars}文字習得 ({hangulProgress}%)
        </p>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-bold text-gray-700 mb-3">今日の学習を始める</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className={`${link.color} text-white rounded-2xl p-4 hover:opacity-90 transition-all hover:-translate-y-0.5 flex items-center gap-3`}>
                <span className={`text-2xl ${link.icon === "한" ? "hangul-char font-black" : ""}`}>
                  {link.icon}
                </span>
                <span className="font-medium text-sm">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent quizzes */}
      {(recentQuizzes ?? []).length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">最近のクイズ</h2>
            <Link href="/quiz" className="text-sm text-korean-red hover:underline">
              クイズ一覧 →
            </Link>
          </div>
          <div className="space-y-2">
            {(recentQuizzes ?? []).map((q, i) => {
              const acc = Math.round((q.correct_answers / q.total_questions) * 100);
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">{getScopeLabel(q.scope)}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${acc >= 80 ? "text-green-600" : acc >= 60 ? "text-yellow-600" : "text-red-500"}`}>
                      {acc}%
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(q.completed_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Badges preview */}
      {(badgeDefs ?? []).length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">バッジ</h2>
            <Link href="/progress" className="text-sm text-korean-red hover:underline">
              すべて見る →
            </Link>
          </div>
          <div className="flex gap-3 flex-wrap">
            {(badgeDefs ?? []).map((badge) => (
              <div
                key={badge.id}
                className={`flex flex-col items-center p-3 rounded-xl border ${
                  earnedBadgeIds.has(badge.id)
                    ? "border-korean-gold bg-yellow-50"
                    : "border-gray-100 bg-gray-50 opacity-40 grayscale"
                }`}
                title={badge.name_jp}
              >
                <span className="text-2xl">{badge.icon}</span>
                <span className="text-xs text-gray-600 mt-1 text-center max-w-16">{badge.name_jp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
