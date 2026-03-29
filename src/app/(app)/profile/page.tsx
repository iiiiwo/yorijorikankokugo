"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [dailyGoal, setDailyGoal] = useState(15);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name ?? "");
        setDailyGoal(profile.daily_goal_minutes);
        setLevel(profile.level);
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        daily_goal_minutes: dailyGoal,
        level,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setMessage("保存に失敗しました。");
    } else {
      setMessage("プロフィールを保存しました！");
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin text-4xl">⚙️</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">プロフィール設定</h1>
        <p className="text-gray-500">学習目標とプロフィールを設定しよう</p>
      </div>

      <form onSubmit={handleSave} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ニックネーム
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-field"
            placeholder="表示名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            現在の韓国語レベル
          </label>
          <div className="space-y-2">
            {[
              { value: "beginner", label: "初心者", desc: "ハングルをこれから学ぶ" },
              { value: "intermediate", label: "初級者", desc: "基本的な単語・文法を知っている" },
              { value: "advanced", label: "中級者", desc: "日常会話ができる" },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  level === opt.value
                    ? "border-korean-red bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="level"
                  value={opt.value}
                  checked={level === opt.value}
                  onChange={(e) => setLevel(e.target.value as "beginner" | "intermediate" | "advanced")}
                  className="accent-korean-red"
                />
                <div>
                  <p className="font-medium text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            1日の学習目標: <span className="text-korean-red font-bold">{dailyGoal}分</span>
          </label>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="w-full accent-korean-red"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5分</span>
            <span>30分</span>
            <span>60分</span>
          </div>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm ${
            message.includes("失敗") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
          }`}>
            {message}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? "保存中..." : "設定を保存"}
        </button>
      </form>

      <div className="card border-red-100">
        <h2 className="font-bold text-gray-700 mb-3">アカウント</h2>
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-3 rounded-xl text-red-600 border border-red-200 hover:bg-red-50 transition-colors font-medium text-sm"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
