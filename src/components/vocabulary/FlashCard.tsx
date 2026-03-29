"use client";

import { useState } from "react";

interface FlashCardProps {
  korean: string;
  romanization: string;
  japanese: string;
  english?: string | null;
  exampleKo?: string | null;
  exampleJp?: string | null;
  onCorrect: () => void;
  onIncorrect: () => void;
}

function speakKorean(text: string) {
  if (typeof window === "undefined") return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.8;
  window.speechSynthesis.speak(utterance);
}

export function FlashCard({
  korean,
  romanization,
  japanese,
  english,
  exampleKo,
  exampleJp,
  onCorrect,
  onIncorrect,
}: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);

  function handleAnswer(correct: boolean) {
    setAnswered(true);
    setTimeout(() => {
      setFlipped(false);
      setAnswered(false);
      if (correct) onCorrect();
      else onIncorrect();
    }, 300);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`flip-card w-full h-64 cursor-pointer ${flipped ? "flipped" : ""}`}
        onClick={() => !answered && setFlipped(!flipped)}
      >
        <div className="flip-card-inner w-full h-full">
          {/* Front */}
          <div className="flip-card-front card flex flex-col items-center justify-center">
            <p className="text-sm text-gray-400 mb-4">クリックして意味を確認</p>
            <div
              className="text-6xl font-black hangul-char text-gray-800 mb-2"
              onClick={(e) => { e.stopPropagation(); speakKorean(korean); }}
            >
              {korean}
            </div>
            <p className="text-lg text-gray-500">{romanization}</p>
            <button
              onClick={(e) => { e.stopPropagation(); speakKorean(korean); }}
              className="mt-3 text-sm text-gray-400 hover:text-korean-red transition-colors flex items-center gap-1"
            >
              🔊 発音を聞く
            </button>
          </div>

          {/* Back */}
          <div className="flip-card-back card flex flex-col items-center justify-center">
            <div className="text-4xl font-black hangul-char text-korean-red mb-2">
              {korean}
            </div>
            <p className="text-sm text-gray-400 mb-1">{romanization}</p>
            <p className="text-2xl font-bold text-gray-800 mb-1">{japanese}</p>
            {english && <p className="text-sm text-gray-400">{english}</p>}
            {exampleKo && (
              <div className="mt-3 text-center">
                <p className="text-sm hangul-char text-gray-600">{exampleKo}</p>
                {exampleJp && <p className="text-xs text-gray-400 mt-0.5">{exampleJp}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answer buttons (only shown when flipped) */}
      {flipped && !answered && (
        <div className="flex gap-3 mt-4 animate-slide-up">
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 py-3 rounded-xl border-2 border-red-300 text-red-600 font-medium hover:bg-red-50 transition-colors"
          >
            もう一度
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 py-3 rounded-xl border-2 border-green-400 text-green-600 font-medium hover:bg-green-50 transition-colors"
          >
            覚えた！
          </button>
        </div>
      )}

      {!flipped && (
        <p className="text-center text-sm text-gray-400 mt-4">
          カードをタップして意味を確認
        </p>
      )}
    </div>
  );
}
