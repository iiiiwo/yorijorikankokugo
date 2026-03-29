import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CharacterDetail } from "@/components/hangul/CharacterDetail";

interface Props {
  params: Promise<{ character: string }>;
}

export default async function CharacterPage({ params }: Props) {
  const { character: encodedChar } = await params;
  const character = decodeURIComponent(encodedChar);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: charData }, { data: allChars }] = await Promise.all([
    supabase
      .from("hangul_characters")
      .select("*")
      .eq("character", character)
      .single(),
    supabase
      .from("hangul_characters")
      .select("id, character, position, type")
      .order("position"),
  ]);

  if (!charData) notFound();

  const { data: progress } = user
    ? await supabase
        .from("character_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("character_id", charData.id)
        .single()
    : { data: null };

  // Find prev/next
  const currentIndex = (allChars ?? []).findIndex((c) => c.id === charData.id);
  const prevChar = currentIndex > 0 ? allChars![currentIndex - 1] : null;
  const nextChar = currentIndex < (allChars?.length ?? 0) - 1
    ? allChars![currentIndex + 1]
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/hangul" className="hover:text-korean-red transition-colors">
          ハングル学習
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-800 hangul-char">{character}</span>
      </div>

      <CharacterDetail character={charData} progress={progress} />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {prevChar ? (
          <Link href={`/hangul/${encodeURIComponent(prevChar.character)}`}>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-korean-red hover:text-korean-red transition-all text-sm">
              <span>←</span>
              <span className="hangul-char font-bold">{prevChar.character}</span>
              前の文字
            </button>
          </Link>
        ) : (
          <div />
        )}
        {nextChar ? (
          <Link href={`/hangul/${encodeURIComponent(nextChar.character)}`}>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-korean-red hover:text-korean-red transition-all text-sm">
              次の文字
              <span className="hangul-char font-bold">{nextChar.character}</span>
              <span>→</span>
            </button>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
