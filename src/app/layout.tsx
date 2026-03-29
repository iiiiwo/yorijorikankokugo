import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "요리조리 한국어 | 韓国語学習アプリ",
  description: "完全初心者から始める韓国語学習アプリ。ハングルの読み書きからAI会話練習まで。",
  keywords: ["韓国語", "ハングル", "韓国語学習", "K-POP", "語学学習"],
  openGraph: {
    title: "요리조리 한국어",
    description: "完全初心者から始める韓国語学習アプリ",
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
