"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "ダッシュボード" },
  { href: "/hangul", icon: "한", label: "ハングル" },
  { href: "/quiz", icon: "📝", label: "クイズ" },
  { href: "/conversation", icon: "💬", label: "AI会話" },
  { href: "/vocabulary", icon: "📚", label: "単語帳" },
  { href: "/progress", icon: "📊", label: "学習履歴" },
  { href: "/profile", icon: "⚙️", label: "プロフィール" },
];

export function Header({ displayName }: { displayName?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="md:hidden bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/dashboard">
          <span className="text-xl font-black korean-text text-korean-red">
            요리조리 한국어
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{displayName}</span>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="w-5 space-y-1">
              <span className={`block h-0.5 bg-gray-600 transition-transform ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
              <span className={`block h-0.5 bg-gray-600 transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 bg-gray-600 transition-transform ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
            </div>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-50">
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-korean-red text-white"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className={item.icon === "한" ? "korean-text font-black" : ""}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <span>🚪</span>
              ログアウト
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
