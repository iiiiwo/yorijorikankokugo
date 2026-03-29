import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, CONVERSATION_SYSTEM_PROMPT, SCENARIO_PROMPTS } from "@/lib/claude/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, sessionId, scenario } = await request.json();

  if (!message || typeof message !== "string" || message.length > 1000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  // Get or create conversation session
  let currentSessionId = sessionId;
  if (!currentSessionId) {
    const { data: session, error } = await supabase
      .from("conversation_sessions")
      .insert({
        user_id: user.id,
        scenario: scenario ?? "greetings",
        title: null,
      })
      .select()
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
    currentSessionId = session.id;
  }

  // Load conversation history (last 20 messages)
  const { data: history } = await supabase
    .from("conversation_messages")
    .select("role, content")
    .eq("session_id", currentSessionId)
    .order("created_at", { ascending: true })
    .limit(20);

  // Save user message
  await supabase.from("conversation_messages").insert({
    session_id: currentSessionId,
    role: "user",
    content: message,
  });

  const scenarioPrompt = SCENARIO_PROMPTS[scenario ?? "greetings"] ?? SCENARIO_PROMPTS.greetings;
  const systemPrompt = `${CONVERSATION_SYSTEM_PROMPT}\n\n現在のシナリオ: ${scenarioPrompt}`;

  const messages = [
    ...(history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // Stream response
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const stream = await anthropic.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        });

        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text, sessionId: currentSessionId })}\n\n`)
            );
          }
        }

        // Save assistant message
        await supabase.from("conversation_messages").insert({
          session_id: currentSessionId,
          role: "assistant",
          content: fullResponse,
        });

        // Update session
        await supabase
          .from("conversation_sessions")
          .update({
            message_count: (history?.length ?? 0) + 2,
            last_message_at: new Date().toISOString(),
          })
          .eq("id", currentSessionId);

        // Record activity
        await supabase.rpc("record_activity", {
          p_user_id: user.id,
          p_xp: 3,
          p_minutes: 1,
        });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Streaming failed" })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
