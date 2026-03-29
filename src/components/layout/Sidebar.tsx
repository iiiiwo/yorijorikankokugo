"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "ダッシュボード" },
  { href: "/hangul", icon: "한", label: "ハングル" },
  { href: "/quiz", icon: "📝", label: "クイズ" },
  { href: "/conversation", icon: "💬", label: "AI会話" },
  { href: "/vocabulary", icon: "📚", label: "単語帳" },
  { href: "/progress", icon: "📊", label: "学習履歴" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard">
          <h1 className="text-xl font-black korean-text text-korean-red leading-tight">
            요리조리
          </h1>
          <p className="text-xs text-gray-500 font-medium">한국어</p>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? "bg-korean-red text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className={`text-lg ${item.icon === "한" ? "korean-text font-black" : ""}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
            pathname === "/profile"
              ? "bg-korean-red text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span className="text-lg">⚙️</span>
          プロフィール
        </Link>
      </div>
    </aside>
  );
}
