import OpenAI from "openai";
import { env } from "../config/env";

const client = new OpenAI({
  apiKey: env.LLM_API_KEY,
  baseURL: env.LLM_BASE_URL,
});

export type StreamInput = {
  prompt: string;
  model?: string;
  temperature?: number;
  top_p?: number;
  signal?: AbortSignal;
};

export async function* completeStream(input: StreamInput) {
  const model = input.model ?? env.LLM_MODEL;

  const stream = await client.chat.completions.create(
    {
      model,
      stream: true,
      messages: [{ role: "user", content: input.prompt }],
      temperature: input.temperature ?? 0.2,
      top_p: input.top_p,
    },
    { signal: input.signal },
  );

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content ?? "";
    if (delta) yield delta;
  }
}
