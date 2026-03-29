"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "ホーム" },
  { href: "/hangul", icon: "한", label: "ハングル" },
  { href: "/quiz", icon: "📝", label: "クイズ" },
  { href: "/conversation", icon: "💬", label: "会話" },
  { href: "/vocabulary", icon: "📚", label: "単語" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 px-1 transition-colors ${
                isActive ? "text-korean-red" : "text-gray-400"
              }`}
            >
              <span className={`text-xl mb-0.5 ${item.icon === "한" ? "korean-text font-black text-base" : ""}`}>
                {item.icon}
              </span>
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
