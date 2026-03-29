import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CharacterCard } from "@/components/hangul/CharacterCard";

export default async function HangulPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: characters }, { data: progressData }] = await Promise.all([
    supabase.from("hangul_characters").select("*").order("position"),
    user
      ? supabase.from("character_progress").select("*").eq("user_id", user.id)
      : { data: [] },
  ]);

  const consonants = characters?.filter((c) => c.type === "consonant") ?? [];
  const vowels = characters?.filter((c) => c.type === "vowel") ?? [];
  const progressMap = new Map(
    (progressData ?? []).map((p) => [p.character_id, p])
  );

  const totalLearned = (progressData ?? []).filter(
    (p) => p.mastery_level >= 1
  ).length;
  const totalChars = characters?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ハングル学習</h1>
        <p className="text-gray-500">子音・母音から学ぶハングルの基礎</p>
      </div>

      {/* Progress overview */}
      <div className="card bg-gradient-to-r from-korean-red to-red-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm">学習済み文字</p>
            <p className="text-4xl font-bold">
              {totalLearned}
              <span className="text-xl text-red-100"> / {totalChars}文字</span>
            </p>
          </div>
          <div className="text-6xl opacity-20 hangul-char font-black">한</div>
        </div>
        <div className="mt-4 bg-red-800 bg-opacity-40 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all"
            style={{ width: `${totalChars > 0 ? (totalLearned / totalChars) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/quiz?scope=hangul_consonants">
          <div className="card hover:shadow-md transition-all hover:-translate-y-0.5 bg-blue-50 border-blue-100">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-bold text-blue-800">子音クイズ</h3>
            <p className="text-sm text-blue-600">子音の読み方をテスト</p>
          </div>
        </Link>
        <Link href="/quiz?scope=hangul_vowels">
          <div className="card hover:shadow-md transition-all hover:-translate-y-0.5 bg-pink-50 border-pink-100">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-bold text-pink-800">母音クイズ</h3>
            <p className="text-sm text-pink-600">母音の読み方をテスト</p>
          </div>
        </Link>
      </div>

      {/* Consonants */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">子音 (자음)</h2>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-sm rounded-full">
            {consonants.length}文字
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
          {consonants.map((char) => (
            <CharacterCard
              key={char.id}
              id={char.id}
              character={char.character}
              romanization={char.romanization}
              pronunciation_jp={char.pronunciation_jp}
              type={char.type as "consonant" | "vowel"}
              masteryLevel={progressMap.get(char.id)?.mastery_level ?? 0}
            />
          ))}
        </div>
      </section>

      {/* Vowels */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">母音 (모음)</h2>
          <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-sm rounded-full">
            {vowels.length}文字
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
          {vowels.map((char) => (
            <CharacterCard
              key={char.id}
              id={char.id}
              character={char.character}
              romanization={char.romanization}
              pronunciation_jp={char.pronunciation_jp}
              type={char.type as "consonant" | "vowel"}
              masteryLevel={progressMap.get(char.id)?.mastery_level ?? 0}
            />
          ))}
        </div>
      </section>

      {/* Legend */}
      <div className="card">
        <h3 className="font-bold text-gray-700 mb-3">習熟度の目安</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
          {[
            { level: 0, label: "未学習", color: "bg-gray-100 text-gray-500" },
            { level: 1, label: "入門", color: "bg-red-100 text-red-600" },
            { level: 2, label: "初級", color: "bg-orange-100 text-orange-600" },
            { level: 3, label: "中級", color: "bg-yellow-100 text-yellow-600" },
            { level: 4, label: "上級", color: "bg-green-100 text-green-600" },
            { level: 5, label: "マスター", color: "bg-blue-100 text-blue-600" },
          ].map(({ level, label, color }) => (
            <div key={level} className={`${color} rounded-lg p-2`}>
              <div className="font-bold">Lv.{level}</div>
              <div>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
