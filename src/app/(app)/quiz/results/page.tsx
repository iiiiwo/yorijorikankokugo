import Link from "next/link";

interface Props {
  searchParams: Promise<{
    correct?: string;
    total?: string;
    xp?: string;
    scope?: string;
  }>;
}

export default async function QuizResultsPage({ searchParams }: Props) {
  const params = await searchParams;
  const correct = parseInt(params.correct ?? "0");
  const total = parseInt(params.total ?? "10");
  const xp = parseInt(params.xp ?? "0");
  const scope = params.scope ?? "hangul_all";

  const accuracy = Math.round((correct / total) * 100);

  const getMessage = () => {
    if (accuracy === 100) return { text: "完璧です！素晴らしい！", emoji: "🏆" };
    if (accuracy >= 80) return { text: "よくできました！", emoji: "🌟" };
    if (accuracy >= 60) return { text: "もう少しで完璧！", emoji: "💪" };
    return { text: "練習あるのみ！", emoji: "📚" };
  };

  const { text, emoji } = getMessage();

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="card text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">クイズ完了！</h1>
        <p className="text-gray-500 mb-6">{text}</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-gray-800">{accuracy}%</p>
            <p className="text-xs text-gray-400 mt-1">正答率</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-green-600">{correct}</p>
            <p className="text-xs text-gray-400 mt-1">正解数</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-korean-gold">{xp}</p>
            <p className="text-xs text-gray-400 mt-1">獲得XP</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>0</span>
            <span>{total}問</span>
          </div>
          <div className="bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                accuracy >= 80 ? "bg-green-500" : accuracy >= 60 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Link href={`/quiz/multiple-choice?scope=${scope}`} className="block">
            <button className="btn-primary w-full">もう一度挑戦</button>
          </Link>
          <Link href="/quiz" className="block">
            <button className="btn-outline w-full">他のクイズを選ぶ</button>
          </Link>
          <Link href="/dashboard" className="block">
            <button className="w-full px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors font-medium">
              ダッシュボードへ
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
