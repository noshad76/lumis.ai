import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const IngestSchema = z.object({
  files: z
    .array(
      z
        .instanceof(File)
        .refine((file) => file.size <= MAX_FILE_SIZE, "Max file size is 10MB.")
        .refine(
          (file) => ACCEPTED_FILE_TYPES.includes(file.type),
          "Only .pdf, .txt, .md and .docx are supported.",
        ),
    )
    .min(1, "At least one file is required.")
    .max(10, "Maximum 10 files allowed per upload."),
});

export type IngestFormValues = z.infer<typeof IngestSchema>;
