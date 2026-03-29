import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const categoryInfo: Record<string, { label: string; emoji: string; color: string }> = {
  greetings: { label: "挨拶・自己紹介", emoji: "👋", color: "from-blue-400 to-blue-500" },
  numbers: { label: "数字", emoji: "🔢", color: "from-purple-400 to-purple-500" },
  food: { label: "食べ物・飲み物", emoji: "🍱", color: "from-orange-400 to-orange-500" },
  daily: { label: "日常表現", emoji: "💬", color: "from-green-400 to-green-500" },
  travel: { label: "旅行・交通", emoji: "✈️", color: "from-cyan-400 to-cyan-500" },
};

export default async function VocabularyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: counts } = await supabase
    .from("vocabulary")
    .select("category");

  const categoryCounts = (counts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + 1;
    return acc;
  }, {});

  // Get mastered vocab count for user
  let masteredCount = 0;
  if (user) {
    const { data: progress } = await supabase
      .from("vocabulary_progress")
      .select("box_number")
      .eq("user_id", user.id)
      .gte("box_number", 4);
    masteredCount = progress?.length ?? 0;
  }

  const totalVocab = counts?.length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">単語帳</h1>
        <p className="text-gray-500">フラッシュカードで単語を効率的に覚えよう</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-4xl font-bold text-korean-red">{masteredCount}</p>
          <p className="text-sm text-gray-400 mt-1">習得済み単語</p>
        </div>
        <div className="card text-center">
          <p className="text-4xl font-bold text-gray-800">{totalVocab}</p>
          <p className="text-sm text-gray-400 mt-1">総単語数</p>
        </div>
      </div>

      {/* Category cards */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-700">カテゴリから学ぶ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(categoryInfo).map(([category, info]) => {
            const count = categoryCounts[category] ?? 0;
            return (
              <Link key={category} href={`/vocabulary/${category}`}>
                <div className={`bg-gradient-to-r ${info.color} text-white rounded-2xl p-5 hover:shadow-lg transition-all hover:-translate-y-0.5`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{info.emoji}</span>
                    <div>
                      <h3 className="font-bold text-lg">{info.label}</h3>
                      <p className="text-sm opacity-80">{count}単語</p>
                    </div>
                    <span className="ml-auto text-2xl opacity-60">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* SRS explanation */}
      <div className="card bg-blue-50 border-blue-100">
        <h3 className="font-bold text-blue-800 mb-2">間隔反復学習（SRS）について</h3>
        <p className="text-sm text-blue-700">
          「覚えた！」を押した単語は間隔を開けて復習します。
          ボックス5（マスター）まで進むと、単語を完全習得した印です。
          定期的に復習することで効率的に記憶に定着させましょう。
        </p>
        <div className="mt-3 flex gap-2 flex-wrap">
          {["Box0: 毎回", "Box1: 1日後", "Box2: 3日後", "Box3: 7日後", "Box4: 14日後", "Box5: 完全習得"].map((box) => (
            <span key={box} className="text-xs bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-200">
              {box}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
