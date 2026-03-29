import Link from "next/link";

export default function LandingPage() {
  const features = [
    {
      icon: "한",
      title: "ハングル学習",
      desc: "子音・母音から段階的に学べます。発音音声で正しい読み方も確認できます。",
      color: "bg-blue-50 border-blue-100",
      iconClass: "text-blue-600 korean-text font-black text-3xl",
    },
    {
      icon: "📝",
      title: "クイズ・テスト",
      desc: "4択クイズで楽しく実力を試せます。苦手な文字・単語を特定して効率的に学習。",
      color: "bg-green-50 border-green-100",
      iconClass: "text-green-600 text-3xl",
    },
    {
      icon: "💬",
      title: "AI会話練習",
      desc: "Claude AIが先生役となり、リアルな韓国語会話をシミュレーション。実践力を身につけよう。",
      color: "bg-purple-50 border-purple-100",
      iconClass: "text-purple-600 text-3xl",
    },
    {
      icon: "📚",
      title: "単語帳 (SRS)",
      desc: "間隔反復学習法（ライトナーシステム）で効率的に単語を記憶に定着させます。",
      color: "bg-orange-50 border-orange-100",
      iconClass: "text-orange-600 text-3xl",
    },
    {
      icon: "📊",
      title: "学習進捗管理",
      desc: "連続学習日数・XP・習熟度グラフで成長を実感。バッジで達成感も得られます。",
      color: "bg-pink-50 border-pink-100",
      iconClass: "text-pink-600 text-3xl",
    },
    {
      icon: "🔊",
      title: "発音練習",
      desc: "Web Speech API対応。テキストを韓国語音声で読み上げ、正しい発音を確認できます。",
      color: "bg-cyan-50 border-cyan-100",
      iconClass: "text-cyan-600 text-3xl",
    },
  ];

  const steps = [
    { num: "1", title: "無料で登録", desc: "メールアドレスとパスワードだけで簡単登録。30秒で始められます。" },
    { num: "2", title: "ハングルを学ぶ", desc: "子音・母音から丁寧に学習。文字を覚えたらクイズで腕試し。" },
    { num: "3", title: "AIと会話練習", desc: "カフェ・空港など様々なシチュエーションでAI先生と練習。" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black korean-text text-korean-red">
            요리조리 한국어
          </h1>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors font-medium">
                ログイン
              </button>
            </Link>
            <Link href="/register">
              <button className="btn-primary text-sm py-2 px-5">
                無料で始める
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-korean-light via-white to-red-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-red-100 text-korean-red px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            🇰🇷 完全ゼロから始める韓国語学習
          </div>
          <h2 className="text-5xl md:text-7xl font-black korean-text text-korean-red mb-4 leading-tight">
            요리조리 한국어
          </h2>
          <p className="text-xl text-gray-600 mb-3">
            ヨリジョリ ハングゴ
          </p>
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
            ハングルの読み書きを基礎から習得し、
            <br className="hidden sm:block" />
            AIとの会話練習で実践的なスピーキング力を身につけよう。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-shadow">
                今すぐ無料で始める →
              </button>
            </Link>
            <Link href="/login">
              <button className="btn-outline text-lg px-8 py-4">
                ログイン
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Hangul showcase */}
      <section className="py-16 bg-gray-50 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-700 mb-8">まずはこの文字から</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅏ", "ㅑ", "ㅓ", "ㅗ", "ㅣ"].map((char) => (
              <div
                key={char}
                className="w-16 h-16 bg-white rounded-2xl border border-gray-200 flex items-center justify-center text-4xl font-black hangul-char text-gray-700 shadow-sm hover:shadow-md transition-shadow hover:border-korean-red hover:text-korean-red cursor-default"
              >
                {char}
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-4">子音14文字 + 母音10文字からスタート</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-3">充実の学習機能</h3>
            <p className="text-gray-500">ゼロから日常会話レベルまで、段階的に力をつけよう</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className={`border rounded-2xl p-6 ${feature.color}`}>
                <div className={`mb-3 ${feature.iconClass}`}>{feature.icon}</div>
                <h4 className="font-bold text-gray-800 text-lg mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-3">始め方は簡単</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 bg-korean-red text-white text-2xl font-black rounded-full flex items-center justify-center mx-auto mb-4">
                  {step.num}
                </div>
                <h4 className="font-bold text-gray-800 text-lg mb-2">{step.title}</h4>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/register">
              <button className="btn-primary text-lg px-8 py-4 shadow-lg">
                無料で韓国語学習を始める
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="korean-text text-xl font-black text-white mb-2">요리조리 한국어</p>
          <p className="text-sm">
            &copy; 2026 요리조리 한국어. Powered by Claude AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
