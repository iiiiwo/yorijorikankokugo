import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const { data: report } = await supabase
    .from("work_reports")
    .select("*")
    .eq("user_id", user.id)
    .eq("report_date", date)
    .single();

  if (!report) {
    return NextResponse.json({ report: null, tasks: [] });
  }

  const { data: tasks } = await supabase
    .from("work_tasks")
    .select("*")
    .eq("report_id", report.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ report, tasks: tasks ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { report_date, overtime_time, overtime_cumulative, completed_tasks, planned_tasks } = body;

  if (!report_date || typeof report_date !== "string") {
    return NextResponse.json({ error: "Invalid report_date" }, { status: 400 });
  }

  // Upsert report
  const { data: report, error: reportError } = await supabase
    .from("work_reports")
    .upsert(
      {
        user_id: user.id,
        report_date,
        overtime_time: overtime_time ?? "",
        overtime_cumulative: overtime_cumulative ?? 0.0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,report_date" }
    )
    .select()
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }

  // Replace all tasks
  await supabase.from("work_tasks").delete().eq("report_id", report.id);

  const allTasks = [
    ...(completed_tasks ?? []).map((t: { client: string; description: string; status: string }, i: number) => ({
      report_id: report.id,
      task_type: "completed",
      client: t.client ?? "",
      description: t.description ?? "",
      status: t.status ?? "",
      sort_order: i,
    })),
    ...(planned_tasks ?? []).map((t: { client: string; description: string }, i: number) => ({
      report_id: report.id,
      task_type: "planned",
      client: t.client ?? "",
      description: t.description ?? "",
      status: "",
      sort_order: i,
    })),
  ];

  if (allTasks.length > 0) {
    const { error: tasksError } = await supabase.from("work_tasks").insert(allTasks);
    if (tasksError) {
      return NextResponse.json({ error: "Failed to save tasks" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, report });
}
