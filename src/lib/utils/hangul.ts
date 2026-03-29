// Hangul utility functions

export const CONSONANTS = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ",
  "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

export const VOWELS = [
  "ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ",
];

export function isKorean(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 0xAC00 && code <= 0xD7A3) ||
    (code >= 0x1100 && code <= 0x11FF) ||
    (code >= 0x3130 && code <= 0x318F);
}

export function getMasteryColor(level: number): string {
  const colors = [
    "bg-gray-200 text-gray-500",
    "bg-red-100 text-red-700",
    "bg-orange-100 text-orange-700",
    "bg-yellow-100 text-yellow-700",
    "bg-green-100 text-green-700",
    "bg-blue-100 text-blue-700",
  ];
  return colors[Math.min(level, 5)];
}

export function getMasteryLabel(level: number): string {
  const labels = ["未学習", "入門", "初級", "中級", "上級", "マスター"];
  return labels[Math.min(level, 5)];
}

export function calculateXpForQuiz(
  correct: number,
  total: number,
  durationSeconds: number
): number {
  const accuracy = correct / total;
  const baseXp = correct * 5;
  const speedBonus = durationSeconds < total * 10 ? Math.floor(baseXp * 0.2) : 0;
  const accuracyBonus = accuracy === 1 ? 10 : accuracy >= 0.8 ? 5 : 0;
  return baseXp + speedBonus + accuracyBonus;
}
