import { z } from "zod";

const ServerEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  QDRANT_URL: z.url(),
  OLLAMA_URL: z.url(),
  HF_ENDPOINT: z.url(),

  QDRANT_COLLECTION: z.string().min(1),
  KNOWLEDGE_DIR: z.string().min(1),
  LLM_MODEL: z.string().min(1),
  EMBED_MODEL: z.string().min(1),
});

const parsed = ServerEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid server environment configuration");
}

export const env = parsed.data;
