import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const quizOptions = [
  {
    href: "/quiz/multiple-choice?scope=hangul_consonants",
    icon: "ㄱㄴㄷ",
    title: "子音クイズ",
    description: "14個の基本子音を覚えよう",
    color: "from-blue-500 to-blue-600",
    badge: "初級",
  },
  {
    href: "/quiz/multiple-choice?scope=hangul_vowels",
    icon: "ㅏㅣㅗ",
    title: "母音クイズ",
    description: "10個の基本母音を覚えよう",
    color: "from-pink-500 to-pink-600",
    badge: "初級",
  },
  {
    href: "/quiz/multiple-choice?scope=vocab_greetings",
    icon: "👋",
    title: "挨拶単語クイズ",
    description: "日常の挨拶フレーズ",
    color: "from-green-500 to-green-600",
    badge: "初級",
  },
  {
    href: "/quiz/multiple-choice?scope=vocab_food",
    icon: "🍱",
    title: "食べ物単語クイズ",
    description: "食べ物・飲み物の単語",
    color: "from-orange-500 to-orange-600",
    badge: "初級",
  },
  {
    href: "/quiz/multiple-choice?scope=vocab_daily",
    icon: "💬",
    title: "日常表現クイズ",
    description: "よく使う日常表現",
    color: "from-purple-500 to-purple-600",
    badge: "初級",
  },
  {
    href: "/quiz/multiple-choice?scope=vocab_travel",
    icon: "✈️",
    title: "旅行単語クイズ",
    description: "旅行で使えるフレーズ",
    color: "from-cyan-500 to-cyan-600",
    badge: "中級",
  },
  {
    href: "/quiz/multiple-choice?scope=hangul_all",
    icon: "🏆",
    title: "総合ハングルクイズ",
    description: "子音・母音すべてをテスト",
    color: "from-korean-red to-red-700",
    badge: "総合",
  },
];

export default async function QuizPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let recentSessions: { id: string; scope: string; correct_answers: number; total_questions: number; completed_at: string }[] = [];
  if (user) {
    const { data } = await supabase
      .from("quiz_sessions")
      .select("id, scope, correct_answers, total_questions, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(5);
    recentSessions = data ?? [];
  }

  function getScopeLabel(scope: string) {
    const labels: Record<string, string> = {
      hangul_consonants: "子音クイズ",
      hangul_vowels: "母音クイズ",
      hangul_all: "総合ハングル",
      vocab_greetings: "挨拶",
      vocab_food: "食べ物",
      vocab_daily: "日常表現",
      vocab_travel: "旅行",
      vocab_numbers: "数字",
    };
    return labels[scope] ?? scope;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">クイズ・テスト</h1>
        <p className="text-gray-500">ハングルと単語の理解度を確認しよう</p>
      </div>

      {/* Quiz cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizOptions.map((option) => (
          <Link key={option.href} href={option.href}>
            <div className={`bg-gradient-to-br ${option.color} text-white rounded-2xl p-6 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl hangul-char font-black">{option.icon}</span>
                <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs font-medium">
                  {option.badge}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">{option.title}</h3>
              <p className="text-sm opacity-80">{option.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent quiz history */}
      {recentSessions.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-800 mb-4">最近のクイズ結果</h2>
          <div className="space-y-3">
            {recentSessions.map((session) => {
              const accuracy = Math.round((session.correct_answers / session.total_questions) * 100);
              return (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800">{getScopeLabel(session.scope)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(session.completed_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-800">{accuracy}%</p>
                    <p className="text-xs text-gray-500">
                      {session.correct_answers}/{session.total_questions}問正解
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
