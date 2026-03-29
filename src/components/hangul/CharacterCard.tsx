"use client";

import Link from "next/link";
import { getMasteryColor, getMasteryLabel } from "@/lib/utils/hangul";

interface CharacterCardProps {
  id: number;
  character: string;
  romanization: string;
  pronunciation_jp: string;
  type: "consonant" | "vowel";
  masteryLevel?: number;
}

export function CharacterCard({
  id,
  character,
  romanization,
  pronunciation_jp,
  type,
  masteryLevel = 0,
}: CharacterCardProps) {
  const masteryColor = getMasteryColor(masteryLevel);
  const masteryLabel = getMasteryLabel(masteryLevel);

  return (
    <Link href={`/hangul/${encodeURIComponent(character)}`}>
      <div className="card hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
        <div className="text-center">
          <div className="text-5xl font-black hangul-char text-gray-800 mb-2 group-hover:text-korean-red transition-colors">
            {character}
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">{romanization}</div>
          <div className="text-xs text-gray-400 mb-3">{pronunciation_jp}</div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${masteryColor}`}>
            {masteryLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
