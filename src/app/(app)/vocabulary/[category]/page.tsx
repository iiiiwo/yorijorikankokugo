"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FlashCard } from "@/components/vocabulary/FlashCard";

const categoryLabels: Record<string, string> = {
  greetings: "挨拶・自己紹介",
  numbers: "数字",
  food: "食べ物・飲み物",
  daily: "日常表現",
  travel: "旅行・交通",
};

interface VocabWord {
  id: number;
  korean: string;
  romanization: string;
  japanese: string;
  english: string | null;
  example_sentence_ko: string | null;
  example_sentence_jp: string | null;
}

const LEITNER_DAYS = [0, 1, 3, 7, 14, 30];

function getNextReview(boxNumber: number): string {
  const days = LEITNER_DAYS[Math.min(boxNumber, 5)];
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export default function VocabCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;
  const supabase = createClient();

  const [words, setWords] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  const loadWords = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vocabulary")
      .select("id, korean, romanization, japanese, english, example_sentence_ko, example_sentence_jp")
      .eq("category", category)
      .order("difficulty");

    setWords(data ?? []);
    setLoading(false);
  }, [category, supabase]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  async function handleAnswer(isCorrect: boolean) {
    if (isCorrect) setCorrect((c) => c + 1);
    else setIncorrect((inc) => inc + 1);

    const word = words[currentIndex];
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Upsert vocabulary progress
      const { data: existing } = await supabase
        .from("vocabulary_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("vocabulary_id", word.id)
        .single();

      const currentBox = existing?.box_number ?? 0;
      const newBox = isCorrect ? Math.min(currentBox + 1, 5) : 0;

      await supabase.from("vocabulary_progress").upsert({
        user_id: user.id,
        vocabulary_id: word.id,
        box_number: newBox,
        correct_count: (existing?.correct_count ?? 0) + (isCorrect ? 1 : 0),
        incorrect_count: (existing?.incorrect_count ?? 0) + (isCorrect ? 0 : 1),
        next_review_at: getNextReview(newBox),
        last_reviewed_at: new Date().toISOString(),
      }, { onConflict: "user_id,vocabulary_id" });
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Save activity
      if (user) {
        await supabase.rpc("record_activity", {
          p_user_id: user.id,
          p_xp: correct + (isCorrect ? 1 : 0),
          p_minutes: Math.max(1, Math.floor(words.length / 5)),
        });
      }
      setFinished(true);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">📚</div>
          <p className="text-gray-500">単語を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (finished) {
    const accuracy = Math.round((correct / words.length) * 100);
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="card text-center">
          <div className="text-6xl mb-4">{accuracy >= 80 ? "🌟" : "📚"}</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">デッキ完了！</h1>
          <div className="grid grid-cols-3 gap-4 my-6">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-green-600">{correct}</p>
              <p className="text-xs text-gray-400 mt-1">覚えた</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-red-500">{incorrect}</p>
              <p className="text-xs text-gray-400 mt-1">要復習</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-gray-700">{accuracy}%</p>
              <p className="text-xs text-gray-400 mt-1">正答率</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => { setCurrentIndex(0); setCorrect(0); setIncorrect(0); setFinished(false); }}
              className="btn-primary w-full"
            >
              もう一度
            </button>
            <Link href="/vocabulary" className="block">
              <button className="btn-outline w-full">単語帳に戻る</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const current = words[currentIndex];

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/vocabulary">
          <button className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            ← 戻る
          </button>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-800">
            {categoryLabels[category] ?? category}
          </h1>
        </div>
        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      {/* Progress */}
      <div className="bg-gray-200 rounded-full h-2">
        <div
          className="bg-korean-red h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex) / words.length) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <FlashCard
        key={current.id}
        korean={current.korean}
        romanization={current.romanization}
        japanese={current.japanese}
        english={current.english}
        exampleKo={current.example_sentence_ko}
        exampleJp={current.example_sentence_jp}
        onCorrect={() => handleAnswer(true)}
        onIncorrect={() => handleAnswer(false)}
      />

      {/* Stats */}
      <div className="flex justify-center gap-6 text-sm text-gray-500">
        <span className="text-green-600 font-medium">✓ 覚えた: {correct}</span>
        <span className="text-red-500 font-medium">✗ 要復習: {incorrect}</span>
      </div>
    </div>
  );
}
