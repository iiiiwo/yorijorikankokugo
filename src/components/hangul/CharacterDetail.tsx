"use client";

import { useState } from "react";
import type { Database } from "@/types/database";

type HangulCharacter = Database["public"]["Tables"]["hangul_characters"]["Row"];
type CharacterProgress = Database["public"]["Tables"]["character_progress"]["Row"];

interface Example {
  word: string;
  reading: string;
  meaning: string;
}

interface CharacterDetailProps {
  character: HangulCharacter;
  progress?: CharacterProgress | null;
}

function speakKorean(text: string) {
  if (typeof window === "undefined") return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.8;
  window.speechSynthesis.speak(utterance);
}

export function CharacterDetail({ character, progress }: CharacterDetailProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const examples = (character.examples as Example[] | null) ?? [];

  function handleSpeak() {
    speakKorean(character.character);
  }

  return (
    <div className="space-y-6">
      {/* Main character display */}
      <div className="card text-center">
        <div
          className={`text-9xl font-black hangul-char text-gray-800 mb-4 inline-block ${
            isAnimating ? "animate-pulse" : ""
          }`}
        >
          {character.character}
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-400">ローマ字</p>
            <p className="text-xl font-bold text-gray-700">{character.romanization}</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div>
            <p className="text-sm text-gray-400">日本語読み</p>
            <p className="text-xl font-bold text-gray-700">{character.pronunciation_jp}</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div>
            <p className="text-sm text-gray-400">筆画数</p>
            <p className="text-xl font-bold text-gray-700">{character.stroke_count}画</p>
          </div>
        </div>

        <button
          onClick={handleSpeak}
          className="btn-primary mx-auto flex items-center gap-2"
        >
          <span>🔊</span>
          発音を聞く
        </button>
      </div>

      {/* Type badge */}
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          character.type === "consonant"
            ? "bg-blue-100 text-blue-700"
            : "bg-pink-100 text-pink-700"
        }`}>
          {character.type === "consonant" ? "子音" : "母音"}
        </span>
        {progress && (
          <span className="text-sm text-gray-500">
            習熟度レベル {progress.mastery_level} / 5
            （正解 {progress.correct_count}回 / 不正解 {progress.incorrect_count}回）
          </span>
        )}
      </div>

      {/* Examples */}
      {examples.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-4">単語例</h3>
          <div className="space-y-3">
            {examples.map((ex, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <button
                  onClick={() => speakKorean(ex.word)}
                  className="text-2xl font-bold hangul-char text-korean-red hover:opacity-70 transition-opacity"
                >
                  {ex.word}
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-600">{ex.reading}</p>
                  <p className="text-sm text-gray-500">{ex.meaning}</p>
                </div>
                <button
                  onClick={() => speakKorean(ex.word)}
                  className="ml-auto text-gray-400 hover:text-korean-red transition-colors"
                  title="発音を聞く"
                >
                  🔊
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Writing tips */}
      <div className="card bg-yellow-50 border-yellow-200">
        <h3 className="font-bold text-yellow-800 mb-2">書き方のポイント</h3>
        <p className="text-sm text-yellow-700">
          {character.type === "consonant"
            ? `「${character.character}」は子音です。母音と組み合わせて音節を作ります。例：${character.character}＋ㅏ = ${examples[0]?.word?.[0] ?? "？"}`
            : `「${character.character}」は母音です。子音と組み合わせて音節を作ります。`}
        </p>
      </div>
    </div>
  );
}
