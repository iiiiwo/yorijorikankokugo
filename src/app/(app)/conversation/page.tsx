"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const scenarios = [
  { id: "greetings", label: "挨拶・自己紹介", emoji: "👋" },
  { id: "cafe", label: "カフェ", emoji: "☕" },
  { id: "shopping", label: "ショッピング", emoji: "🛍️" },
  { id: "restaurant", label: "レストラン", emoji: "🍽️" },
  { id: "airport", label: "空港", emoji: "✈️" },
  { id: "directions", label: "道案内", emoji: "🗺️" },
];

function speakKorean(text: string) {
  if (typeof window === "undefined") return;
  // Extract Korean text (rough approximation)
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scenario, setScenario] = useState("greetings");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function startSession() {
    setStarted(true);
    setMessages([
      {
        role: "assistant",
        content: `안녕하세요（こんにちは）！ヨリジョリ先生です。${
          scenarios.find((s) => s.id === scenario)?.label ?? ""
        }の練習を始めましょう！\n\n気軽に韓国語や日本語で話しかけてください。間違えても大丈夫ですよ！`,
      },
    ]);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "", isStreaming: true },
    ]);

    try {
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          scenario,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";
      let newSessionId = sessionId;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                aiResponse += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: aiResponse,
                    isStreaming: true,
                  };
                  return updated;
                });
              }
              if (parsed.sessionId && !newSessionId) {
                newSessionId = parsed.sessionId;
                setSessionId(parsed.sessionId);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: aiResponse,
          isStreaming: false,
        };
        return updated;
      });
    } catch (error) {
      console.error(error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "エラーが発生しました。もう一度お試しください。",
          isStreaming: false,
        };
        return updated;
      });
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function resetSession() {
    setMessages([]);
    setSessionId(null);
    setStarted(false);
    setLoading(false);
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">AI会話練習</h1>
          <p className="text-gray-500">AIの先生と韓国語で会話練習しよう</p>
        </div>

        <div className="card">
          <h2 className="font-bold text-gray-700 mb-4">シナリオを選んでください</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  scenario === s.id
                    ? "border-korean-red bg-red-50 text-korean-red"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <div className="text-2xl mb-1">{s.emoji}</div>
                <div className="text-sm font-medium">{s.label}</div>
              </button>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-1">使い方</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>・韓国語または日本語で入力できます</li>
              <li>・間違えても先生が優しく教えてくれます</li>
              <li>・Enterキーで送信（Shift+Enterで改行）</li>
            </ul>
          </div>

          <button onClick={startSession} className="btn-primary w-full">
            会話を始める
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {scenarios.find((s) => s.id === scenario)?.emoji}{" "}
            {scenarios.find((s) => s.id === scenario)?.label}
          </h1>
          <p className="text-xs text-gray-400">ヨリジョリ先生と会話練習</p>
        </div>
        <button
          onClick={resetSession}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-3 py-1 rounded-lg hover:bg-gray-100"
        >
          リセット
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-korean-red text-white flex items-center justify-center text-xs font-bold mr-2 mt-1 flex-shrink-0">
                AI
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-korean-red text-white rounded-tr-sm"
                  : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap hangul-char leading-relaxed">
                {msg.content}
                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-current ml-1 animate-pulse" />
                )}
              </p>
              {msg.role === "assistant" && !msg.isStreaming && msg.content && (
                <button
                  onClick={() => speakKorean(msg.content)}
                  className="mt-1 text-xs text-gray-400 hover:text-korean-red transition-colors flex items-center gap-1"
                >
                  🔊 読み上げ
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力... (Enter で送信)"
            className="flex-1 resize-none input-field min-h-[44px] max-h-32 py-2.5"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="btn-primary py-2.5 px-4 flex-shrink-0"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "送信"
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Shift+Enter で改行 / Enter で送信
        </p>
      </div>
    </div>
  );
}
