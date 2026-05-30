export type SSEEventName = "trace" | "token" | "meta" | "done" | "error";

export function sseFrame(event: SSEEventName, data?: unknown) {
  // SSE format: event: <name>\ndata: <json>\n\n
  const payload =
    data === undefined ? "" : `data: ${JSON.stringify(data)}\n`;
  return `event: ${event}\n${payload}\n`;
}

export function encodeSSE(event: SSEEventName, data?: unknown) {
  return new TextEncoder().encode(sseFrame(event, data));
}
