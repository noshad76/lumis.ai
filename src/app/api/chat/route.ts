import { NextRequest } from "next/server";
import { z } from "zod";
import { askStream } from "@/core/agent/askStream";
import { encodeSSE, SSEEventName } from "@/core/streaming/sse";

export const runtime = "nodejs";

const ChatBodySchema = z.object({
  question: z.string().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .max(20)
    .default([]),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ChatBodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { question, history } = parsed.data;

  const stream = new ReadableStream<Uint8Array>({
    start: async (controller) => {
      const abortController = new AbortController();

      const onAbort = () => abortController.abort();
      req.signal.addEventListener("abort", onAbort);

      const send = (event: SSEEventName, data?: any) => {
        controller.enqueue(encodeSSE(event as any, data));
      };

      try {
        await askStream(question, history, {
          signal: abortController.signal,
          emitTrace: (t) => send("trace", t),
          emitToken: (delta) => send("token", { delta }),
          emitMeta: (meta) => send("meta", meta),
        });

        send("done");
      } catch (e: any) {
        send("error", { message: e?.message ?? String(e) });
      } finally {
        req.signal.removeEventListener("abort", onAbort);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
