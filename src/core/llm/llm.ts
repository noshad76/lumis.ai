import OpenAI from "openai";
import { env } from "../config/env";

const client = new OpenAI({
  apiKey: env.LLM_API_KEY,
  baseURL: env.LLM_BASE_URL,
});

export type CompleteInput = {
  prompt: string;
  model?: string;
  temperature?: number;
  top_p?: number;
};

export type CompleteOutput = {
  text: string;
  model: string;
  done: boolean;
};

export const completeOnce = async (
  input: CompleteInput,
): Promise<CompleteOutput> => {
  const model = input.model ?? env.LLM_MODEL;

  const res = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: input.prompt,
      },
    ],
    temperature: input.temperature ?? 0.2,
    top_p: input.top_p,
  });

  return {
    done: true,
    text: res.choices?.[0]?.message?.content ?? "",
    model: res.model ?? model,
  };
};

export const listLocalModels = async () => {
  return {
    data: [
      {
        id: env.LLM_MODEL,
        object: "model",
      },
    ],
  };
};
