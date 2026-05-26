import { pipeline, env as xenovaEnv } from "@xenova/transformers";
import { env } from "../config/env";
xenovaEnv.remoteHost = env.HF_ENDPOINT;
xenovaEnv.localModelPath = "./models-cache/";
xenovaEnv.allowRemoteModels = true;
xenovaEnv.backends.onnx.wasm.proxy = true;
xenovaEnv.allowLocalModels = true;
let embedder: any = null;

export const getEmbedding = async (text: string) => {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", env.EMBED_MODEL);
  }
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data) as number[];
};
