import { Ollama } from "ollama";
import { env } from "../config/env";

const ollama = new Ollama({ host: env.OLLAMA_URL });

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
  const res = await ollama.generate({
    model,
    prompt: input.prompt,
    stream: false, //todo must be changed
    options: {
      temperature: input.temperature ?? 0.2,
      top_p: input.top_p,
    },
  });
  return {
    done: !!res.done,
    text: res.response ?? "",
    model: res.model ?? model,
  };
};

export const listLocalModels = () => {
  return ollama.list();
};
