"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateXpForQuiz } from "@/lib/utils/hangul";

interface Question {
  id: number;
  question: string;
  answer: string;
  options: string[];
  type: "hangul" | "vocabulary";
  questionMode: "char_to_reading" | "reading_to_char" | "ko_to_jp" | "jp_to_ko";
}

interface QuizResult {
  questionId: number;
  question: string;
  answer: string;
  userAnswer: string;
  isCorrect: boolean;
  type: "hangul" | "vocabulary";
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateWrongOptions(correct: string, allOptions: string[], count: number): string[] {
  const others = allOptions.filter((o) => o !== correct);
  return shuffleArray(others).slice(0, count);
}

function MultipleChoiceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scope = searchParams.get("scope") ?? "hangul_all";
  const supabase = createClient();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [answered, setAnswered] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);

    if (scope.startsWith("hangul")) {
      const { data: chars } = await supabase
        .from("hangul_characters")
        .select("*")
        .order("position");

      if (!chars || chars.length === 0) {
        setLoading(false);
        return;
      }

      const filtered = scope === "hangul_consonants"
        ? chars.filter((c) => c.type === "consonant")
        : scope === "hangul_vowels"
        ? chars.filter((c) => c.type === "vowel")
        : chars;

      const allReadings = chars.map((c) => c.romanization);
      const allChars = chars.map((c) => c.character);

      const qs: Question[] = shuffleArray(filtered).slice(0, 10).map((char) => {
        const mode = Math.random() > 0.5 ? "char_to_reading" : "reading_to_char";
        if (mode === "char_to_reading") {
          const wrongOptions = generateWrongOptions(char.romanization, allReadings, 3);
          return {
            id: char.id,
            question: char.character,
            answer: char.romanization,
            options: shuffleArray([char.romanization, ...wrongOptions]),
            type: "hangul" as const,
            questionMode: "char_to_reading" as const,
          };
        } else {
          const wrongOptions = generateWrongOptions(char.character, allChars, 3);
          return {
            id: char.id,
            question: `「${char.romanization}」${(char as { pronunciation_jp?: string }).pronunciation_jp ? `（${(char as { pronunciation_jp?: string }).pronunciation_jp}）` : ""}`,
            answer: char.character,
            options: shuffleArray([char.character, ...wrongOptions]),
            type: "hangul" as const,
            questionMode: "reading_to_char" as const,
          };
        }
      });

      setQuestions(qs);
    } else {
      const category = scope.replace("vocab_", "");
      const { data: words } = await supabase
        .from("vocabulary")
        .select("*")
        .eq("category", category);

      if (!words || words.length === 0) {
        // Fallback to all vocab
        const { data: allWords } = await supabase.from("vocabulary").select("*");
        if (!allWords || allWords.length === 0) {
          setLoading(false);
          return;
        }
        buildVocabQuestions(allWords);
        return;
      }

      buildVocabQuestions(words);
    }

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  function buildVocabQuestions(words: { id: number; korean: string; japanese: string; romanization: string }[]) {
    const allKorean = words.map((w) => w.korean);
    const allJapanese = words.map((w) => w.japanese);

    const qs: Question[] = shuffleArray(words).slice(0, 10).map((word) => {
      const mode = Math.random() > 0.5 ? "ko_to_jp" : "jp_to_ko";
      if (mode === "ko_to_jp") {
        const wrongOptions = generateWrongOptions(word.japanese, allJapanese, 3);
        return {
          id: word.id,
          question: word.korean,
          answer: word.japanese,
          options: shuffleArray([word.japanese, ...wrongOptions]),
          type: "vocabulary" as const,
          questionMode: "ko_to_jp" as const,
        };
      } else {
        const wrongOptions = generateWrongOptions(word.korean, allKorean, 3);
        return {
          id: word.id,
          question: word.japanese,
          answer: word.korean,
          options: shuffleArray([word.korean, ...wrongOptions]),
          type: "vocabulary" as const,
          questionMode: "jp_to_ko" as const,
        };
      }
    });

    setQuestions(qs);
    setLoading(false);
  }

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  async function handleAnswer(option: string) {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);

    const current = questions[currentIndex];
    const isCorrect = option === current.answer;

    const newResult: QuizResult = {
      questionId: current.id,
      question: current.question,
      answer: current.answer,
      userAnswer: option,
      isCorrect,
      type: current.type,
    };

    const newResults = [...results, newResult];
    setResults(newResults);

    setTimeout(async () => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setAnswered(false);
      } else {
        // Quiz complete — save results
        const duration = Math.floor((Date.now() - startTime) / 1000);
        const correctCount = newResults.filter((r) => r.isCorrect).length;
        const xp = calculateXpForQuiz(correctCount, newResults.length, duration);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: session } = await supabase
            .from("quiz_sessions")
            .insert({
              user_id: user.id,
              quiz_type: "multiple_choice",
              scope,
              total_questions: newResults.length,
              correct_answers: correctCount,
              xp_earned: xp,
              duration_seconds: duration,
            })
            .select()
            .single();

          if (session) {
            // Record activity
            await supabase.rpc("record_activity", {
              p_user_id: user.id,
              p_xp: xp,
              p_minutes: Math.max(1, Math.floor(duration / 60)),
            });
          }
        }

        router.push(
          `/quiz/results?correct=${correctCount}&total=${newResults.length}&xp=${xp}&scope=${scope}`
        );
      }
    }, 1200);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⭕</div>
          <p className="text-gray-500">問題を準備中...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-gray-500">問題が見つかりませんでした。</p>
      </div>
    );
  }

  const current = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const isHangulMode = current.questionMode === "reading_to_char" || current.questionMode === "char_to_reading";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-korean-red h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Question */}
      <div className="card text-center min-h-48 flex flex-col items-center justify-center">
        <p className="text-sm text-gray-400 mb-4">
          {current.questionMode === "char_to_reading" && "この文字の読み方は？"}
          {current.questionMode === "reading_to_char" && "この読み方に対応するハングルは？"}
          {current.questionMode === "ko_to_jp" && "この韓国語の意味は？"}
          {current.questionMode === "jp_to_ko" && "この日本語を韓国語で言うと？"}
        </p>
        <div className={`font-bold text-gray-800 ${
          isHangulMode && current.questionMode === "char_to_reading"
            ? "text-8xl hangul-char"
            : "text-3xl"
        }`}>
          {current.question}
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {current.options.map((option) => {
          let buttonClass = "p-4 rounded-xl border-2 font-medium text-center transition-all cursor-pointer text-lg ";
          if (!answered) {
            buttonClass += "border-gray-200 hover:border-korean-red hover:bg-red-50 text-gray-800";
          } else if (option === current.answer) {
            buttonClass += "border-green-500 bg-green-50 text-green-700";
          } else if (option === selectedAnswer && option !== current.answer) {
            buttonClass += "border-red-400 bg-red-50 text-red-600";
          } else {
            buttonClass += "border-gray-200 text-gray-400";
          }

          const isKoreanOption = /[\uAC00-\uD7A3\u3130-\u318F\u1100-\u11FF]/.test(option);

          return (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              className={buttonClass}
              disabled={answered}
            >
              <span className={isKoreanOption ? "hangul-char" : ""}>
                {option}
              </span>
              {answered && option === current.answer && " ✓"}
              {answered && option === selectedAnswer && option !== current.answer && " ✗"}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div className={`p-4 rounded-xl text-center font-medium animate-slide-up ${
          selectedAnswer === current.answer
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}>
          {selectedAnswer === current.answer
            ? "正解！素晴らしい！🎉"
            : `不正解。正解は「${current.answer}」でした。`}
        </div>
      )}
    </div>
  );
}

export default function MultipleChoicePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⭕</div>
          <p className="text-gray-500">問題を準備中...</p>
        </div>
      </div>
    }>
      <MultipleChoiceContent />
    </Suspense>
  );
}
