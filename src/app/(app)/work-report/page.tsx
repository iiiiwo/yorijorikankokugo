"use client";

import { useState, useEffect, useCallback } from "react";

type Task = {
  id: string;
  client: string;
  description: string;
  status: string;
};

type PlannedTask = {
  id: string;
  client: string;
  description: string;
};

type ReportState = {
  overtimeTime: string;
  overtimeCumulative: string;
  completedTasks: Task[];
  plannedTasks: PlannedTask[];
};

function getNextWeekdayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay();
  const labels = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
  const nextDayIndex = day === 5 || day === 6 || day === 0 ? 1 : day + 1;
  return labels[nextDayIndex];
}

function generateReportText(date: string, state: ReportState): string {
  const completedLines = state.completedTasks
    .filter((t) => t.client || t.description)
    .map((t) => `・${t.client}：${t.description}${t.status ? ` ${t.status}` : ""}`)
    .join("\n");

  const plannedLines = state.plannedTasks
    .filter((t) => t.client || t.description)
    .map((t) => `・${t.client}：${t.description}`)
    .join("\n");

  const nextDay = getNextWeekdayLabel(date);

  return [
    "＜作業実績＞",
    completedLines || "（なし）",
    "＜残業予定＞",
    `残業 ${state.overtimeTime || "なし"}　累計${state.overtimeCumulative || "0.0"}H`,
    `＜${nextDay}の作業予定＞`,
    plannedLines || "（なし）",
  ].join("\n");
}

function newTask(): Task {
  return { id: crypto.randomUUID(), client: "", description: "", status: "" };
}

function newPlanned(): PlannedTask {
  return { id: crypto.randomUUID(), client: "", description: "" };
}

export default function WorkReportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [state, setState] = useState<ReportState>({
    overtimeTime: "",
    overtimeCumulative: "0.0",
    completedTasks: [newTask()],
    plannedTasks: [newPlanned()],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const loadReport = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/work-report?date=${d}`);
      const data = await res.json();
      if (data.report) {
        const completedTasks: Task[] = (data.tasks ?? [])
          .filter((t: { task_type: string }) => t.task_type === "completed")
          .map((t: { id: string; client: string; description: string; status: string }) => ({
            id: t.id,
            client: t.client,
            description: t.description,
            status: t.status,
          }));
        const plannedTasks: PlannedTask[] = (data.tasks ?? [])
          .filter((t: { task_type: string }) => t.task_type === "planned")
          .map((t: { id: string; client: string; description: string }) => ({
            id: t.id,
            client: t.client,
            description: t.description,
          }));
        setState({
          overtimeTime: data.report.overtime_time ?? "",
          overtimeCumulative: String(data.report.overtime_cumulative ?? "0.0"),
          completedTasks: completedTasks.length > 0 ? completedTasks : [newTask()],
          plannedTasks: plannedTasks.length > 0 ? plannedTasks : [newPlanned()],
        });
      } else {
        setState({
          overtimeTime: "",
          overtimeCumulative: "0.0",
          completedTasks: [newTask()],
          plannedTasks: [newPlanned()],
        });
      }
    } catch {
      // keep default state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(date);
  }, [date, loadReport]);

  const save = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/work-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_date: date,
          overtime_time: state.overtimeTime,
          overtime_cumulative: parseFloat(state.overtimeCumulative) || 0,
          completed_tasks: state.completedTasks.filter((t) => t.client || t.description),
          planned_tasks: state.plannedTasks.filter((t) => t.client || t.description),
        }),
      });
      if (res.ok) {
        setSaveMsg("保存しました");
        setTimeout(() => setSaveMsg(""), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    const text = generateReportText(date, state);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateCompleted = (id: string, field: keyof Task, value: string) => {
    setState((s) => ({
      ...s,
      completedTasks: s.completedTasks.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));
  };

  const updatePlanned = (id: string, field: keyof PlannedTask, value: string) => {
    setState((s) => ({
      ...s,
      plannedTasks: s.plannedTasks.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));
  };

  const removeCompleted = (id: string) => {
    setState((s) => ({
      ...s,
      completedTasks: s.completedTasks.length > 1 ? s.completedTasks.filter((t) => t.id !== id) : s.completedTasks,
    }));
  };

  const removePlanned = (id: string) => {
    setState((s) => ({
      ...s,
      plannedTasks: s.plannedTasks.length > 1 ? s.plannedTasks.filter((t) => t.id !== id) : s.plannedTasks,
    }));
  };

  const reportText = generateReportText(date, state);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-6">
        <h1 className="text-xl font-bold mb-1">日報作成</h1>
        <p className="text-blue-100 text-sm">入力してコピーするだけで日報完成</p>
      </div>

      {/* Date selector */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">報告日</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-field"
        />
      </div>

      {/* 作業実績 */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">＜作業実績＞</h2>
          <button
            onClick={() => setState((s) => ({ ...s, completedTasks: [...s.completedTasks, newTask()] }))}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ＋ タスク追加
          </button>
        </div>

        {state.completedTasks.map((task) => (
          <div key={task.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="案件名（例：長野市）"
                value={task.client}
                onChange={(e) => updateCompleted(task.id, "client", e.target.value)}
                className="input-field text-sm py-2 flex-1"
              />
              <button
                onClick={() => removeCompleted(task.id)}
                className="text-gray-400 hover:text-red-500 px-2 flex-shrink-0"
                title="削除"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              placeholder="作業内容"
              value={task.description}
              onChange={(e) => updateCompleted(task.id, "description", e.target.value)}
              className="input-field text-sm py-2"
            />
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="進捗（例：完了 / 40/100 / 空欄でもOK）"
                value={task.status}
                onChange={(e) => updateCompleted(task.id, "status", e.target.value)}
                className="input-field text-sm py-2 flex-1"
              />
              <button
                onClick={() => updateCompleted(task.id, "status", "完了")}
                className={`flex-shrink-0 text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${
                  task.status === "完了"
                    ? "bg-green-500 text-white border-green-500"
                    : "border-green-400 text-green-600 hover:bg-green-50"
                }`}
              >
                完了
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 残業予定 */}
      <div className="card space-y-3">
        <h2 className="font-bold text-gray-800">＜残業予定＞</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">残業時刻（例：21:30）</label>
            <input
              type="text"
              placeholder="21:30 または なし"
              value={state.overtimeTime}
              onChange={(e) => setState((s) => ({ ...s, overtimeTime: e.target.value }))}
              className="input-field text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">累計時間（H）</label>
            <input
              type="text"
              placeholder="0.0"
              value={state.overtimeCumulative}
              onChange={(e) => setState((s) => ({ ...s, overtimeCumulative: e.target.value }))}
              className="input-field text-sm py-2"
            />
          </div>
        </div>
      </div>

      {/* 翌営業日の作業予定 */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">＜{getNextWeekdayLabel(date)}の作業予定＞</h2>
          <button
            onClick={() => setState((s) => ({ ...s, plannedTasks: [...s.plannedTasks, newPlanned()] }))}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ＋ タスク追加
          </button>
        </div>

        {state.plannedTasks.map((task) => (
          <div key={task.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="案件名（例：長野市）"
                value={task.client}
                onChange={(e) => updatePlanned(task.id, "client", e.target.value)}
                className="input-field text-sm py-2 flex-1"
              />
              <button
                onClick={() => removePlanned(task.id)}
                className="text-gray-400 hover:text-red-500 px-2 flex-shrink-0"
                title="削除"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              placeholder="作業内容"
              value={task.description}
              onChange={(e) => updatePlanned(task.id, "description", e.target.value)}
              className="input-field text-sm py-2"
            />
          </div>
        ))}
      </div>

      {/* Generated report */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">生成された日報</h2>
          <button
            onClick={copyToClipboard}
            className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${
              copied
                ? "bg-green-500 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {copied ? "コピー済み ✓" : "コピー"}
          </button>
        </div>
        <pre className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed border border-gray-200">
          {reportText}
        </pre>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary flex-1"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
        {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
      </div>
    </div>
  );
}
