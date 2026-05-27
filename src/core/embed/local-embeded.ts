import { pipeline, env as xenovaEnv } from "@xenova/transformers";
import { env } from "../config/env";
import path from "path";
// xenovaEnv.remoteHost = env.HF_ENDPOINT;
xenovaEnv.localModelPath = path.join(process.cwd(), "models-cache");
xenovaEnv.allowRemoteModels = true;
let embedder: any = null;

export const getEmbedding = async (text: string) => {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", env.EMBED_MODEL);
  }
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data) as number[];
};
