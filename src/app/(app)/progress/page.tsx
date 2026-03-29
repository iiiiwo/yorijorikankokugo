import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BadgeCard } from "@/components/ui/Badge";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: activity },
    { data: quizSessions },
    { data: userBadges },
    { data: badgeDefs },
    { data: charProgress },
    { data: hangulChars },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("daily_activity")
      .select("activity_date, xp_earned, minutes_studied")
      .eq("user_id", user.id)
      .order("activity_date", { ascending: false })
      .limit(90),
    supabase
      .from("quiz_sessions")
      .select("quiz_type, scope, correct_answers, total_questions, xp_earned, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(20),
    supabase
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", user.id),
    supabase.from("badge_definitions").select("*"),
    supabase
      .from("character_progress")
      .select("character_id, mastery_level, correct_count, incorrect_count")
      .eq("user_id", user.id),
    supabase.from("hangul_characters").select("id, character, type, position").order("position"),
  ]);

  const earnedBadgeMap = new Map(
    (userBadges ?? []).map((b) => [b.badge_id, b.earned_at])
  );
  const progressMap = new Map(
    (charProgress ?? []).map((p) => [p.character_id, p])
  );

  // Build heatmap data for last 30 days
  const today = new Date();
  const heatmapDays: { date: string; xp: number; active: boolean }[] = [];
  const activityMap = new Map(
    (activity ?? []).map((a) => [a.activity_date, a])
  );
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const act = activityMap.get(dateStr);
    heatmapDays.push({ date: dateStr, xp: act?.xp_earned ?? 0, active: !!act });
  }

  const totalStudyDays = (activity ?? []).length;
  const totalXp = profile?.xp_total ?? 0;
  const totalMinutes = (activity ?? []).reduce((sum, a) => sum + a.minutes_studied, 0);
  const totalQuizzes = quizSessions?.length ?? 0;
  const avgAccuracy =
    (quizSessions ?? []).length > 0
      ? Math.round(
          (quizSessions ?? []).reduce(
            (sum, q) => sum + q.correct_answers / q.total_questions,
            0
          ) / (quizSessions ?? []).length * 100
        )
      : 0;

  const consonants = (hangulChars ?? []).filter((c) => c.type === "consonant");
  const vowels = (hangulChars ?? []).filter((c) => c.type === "vowel");

  function getMasteryClass(level: number) {
    const classes = ["bg-gray-100", "bg-red-200", "bg-orange-300", "bg-yellow-300", "bg-green-400", "bg-blue-500"];
    return classes[Math.min(level, 5)];
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">学習履歴・進捗</h1>
        <p className="text-gray-500">あなたの学習の成果を確認しよう</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "総学習日数", value: totalStudyDays, unit: "日", icon: "📅" },
          { label: "総XP", value: totalXp, unit: "", icon: "⭐" },
          { label: "総学習時間", value: Math.floor(totalMinutes / 60), unit: "時間", icon: "⏱️" },
          { label: "クイズ平均正答率", value: avgAccuracy, unit: "%", icon: "📊" },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="text-2xl font-bold text-gray-800">
              {stat.value.toLocaleString()}{stat.unit}
            </p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Streak */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔥</span>
          <div>
            <h2 className="font-bold text-gray-700">連続学習日数</h2>
            <p className="text-3xl font-bold text-korean-red">{profile?.streak_days ?? 0}日</p>
          </div>
        </div>

        {/* Activity heatmap */}
        <h3 className="text-sm text-gray-500 mb-2">直近30日の学習記録</h3>
        <div className="flex flex-wrap gap-1">
          {heatmapDays.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.xp} XP`}
              className={`w-7 h-7 rounded-md ${
                !day.active
                  ? "bg-gray-100"
                  : day.xp >= 50
                  ? "bg-green-500"
                  : day.xp >= 20
                  ? "bg-green-300"
                  : "bg-green-100"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <span>学習なし</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-gray-100" />
            <div className="w-3 h-3 rounded bg-green-100" />
            <div className="w-3 h-3 rounded bg-green-300" />
            <div className="w-3 h-3 rounded bg-green-500" />
          </div>
          <span>多い</span>
        </div>
      </div>

      {/* Hangul mastery */}
      <div className="card">
        <h2 className="font-bold text-gray-700 mb-4">ハングル習熟度マップ</h2>

        <h3 className="text-sm font-medium text-gray-500 mb-2">子音</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {consonants.map((char) => {
            const prog = progressMap.get(char.id);
            const level = prog?.mastery_level ?? 0;
            return (
              <div
                key={char.id}
                title={`${char.character}: レベル ${level}`}
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold hangul-char text-lg ${getMasteryClass(level)} ${level > 0 ? "text-gray-800" : "text-gray-400"}`}
              >
                {char.character}
              </div>
            );
          })}
        </div>

        <h3 className="text-sm font-medium text-gray-500 mb-2">母音</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {vowels.map((char) => {
            const prog = progressMap.get(char.id);
            const level = prog?.mastery_level ?? 0;
            return (
              <div
                key={char.id}
                title={`${char.character}: レベル ${level}`}
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold hangul-char text-lg ${getMasteryClass(level)} ${level > 0 ? "text-gray-800" : "text-gray-400"}`}
              >
                {char.character}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
          <span>未学習</span>
          {["bg-gray-100", "bg-red-200", "bg-orange-300", "bg-yellow-300", "bg-green-400", "bg-blue-500"].map((c, i) => (
            <div key={i} className={`w-5 h-5 rounded ${c}`} title={`Lv.${i}`} />
          ))}
          <span>マスター</span>
        </div>
      </div>

      {/* Quiz history */}
      {(quizSessions ?? []).length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-4">クイズ履歴</h2>
          <div className="space-y-2">
            {(quizSessions ?? []).slice(0, 10).map((session, i) => {
              const acc = Math.round((session.correct_answers / session.total_questions) * 100);
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{session.scope}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(session.completed_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${acc >= 80 ? "text-green-600" : acc >= 60 ? "text-yellow-600" : "text-red-500"}`}>
                      {acc}%
                    </p>
                    <p className="text-xs text-gray-400">+{session.xp_earned} XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Badges */}
      <div>
        <h2 className="font-bold text-gray-700 mb-4">バッジ・実績</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {(badgeDefs ?? []).map((badge) => (
            <BadgeCard
              key={badge.id}
              icon={badge.icon}
              name={badge.name_jp}
              description={badge.description_jp}
              earned={earnedBadgeMap.has(badge.id)}
              earnedAt={earnedBadgeMap.get(badge.id)}
              xpReward={badge.xp_reward}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
