"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  CloudUpload,
} from "lucide-react";
import { ingestKnowledgeAction } from "@/actions/ingest";

type FileStatus = "pending" | "processing" | "done" | "error";

interface IngestFile {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  rawFile: File;
}

const STATUS_CONFIG: Record<
  FileStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "text-text-muted",
    icon: <FileText size={14} />,
  },
  processing: {
    label: "Processing",
    color: "text-warning",
    icon: (
      <div className="w-3.5 h-3.5 rounded-full border-2 border-warning border-t-transparent animate-spin" />
    ),
  },
  done: {
    label: "Indexed",
    color: "text-success",
    icon: <CheckCircle2 size={14} />,
  },
  error: {
    label: "Error",
    color: "text-danger",
    icon: <AlertCircle size={14} />,
  },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IngestPage() {
  const [files, setFiles] = useState<IngestFile[]>([]);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles: IngestFile[] = Array.from(incoming).map((f) => ({
      id: `${f.name}-${Date.now()}`,
      name: f.name,
      size: f.size,
      status: "pending",
      rawFile: f,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const handleIndex = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "processing" } : f,
      ),
    );

    try {
      const formData = new FormData();
      pendingFiles.forEach((f) => {
        formData.append("files", f.rawFile);
      });

      const result = await ingestKnowledgeAction(formData);

      if (result.success) {
        setFiles((prev) =>
          prev.map((f) =>
            f.status === "processing" ? { ...f, status: "done" } : f,
          ),
        );
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error(err);
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "processing" ? { ...f, status: "error" } : f,
        ),
      );
    }
  };
  return (
    <div className="flex-1 flex flex-col p-8 gap-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <p className="text-caption mb-1">Knowledge Base</p>
        <h1 className="text-title-2 text-text">Ingest Documents</h1>
        <p className="text-body-sm mt-1">
          Upload files to index into the vector store for retrieval.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-(--radius-xl) p-12
          flex-center flex-col gap-4 cursor-pointer transition-all duration-200
          ${
            dragging
              ? "border-primary bg-primary-soft scale-[1.01]"
              : "border-border hover:border-primary hover:bg-primary-soft"
          }
        `}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.txt,.md,.docx"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <div
          className={`
          w-16 h-16 rounded-(--radius-lg) flex-center transition-colors
          ${dragging ? "bg-primary text-white" : "bg-surface-muted text-primary"}
        `}
        >
          <CloudUpload size={28} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-text">
            {dragging ? "Drop files here" : "Drag & drop files"}
          </p>
          <p className="text-body-sm mt-1">
            PDF, TXT, MD, DOCX — or{" "}
            <span className="text-primary font-medium">browse</span>
          </p>
        </div>
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div className="surface-card p-0! overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-headline">
              Queue
              <span className="ml-2 text-sm font-normal text-text-muted">
                {files.length} file{files.length !== 1 ? "s" : ""}
              </span>
            </h2>
            {pendingCount > 0 && (
              <button
                onClick={handleIndex}
                className="
                flex items-center gap-2 px-4 py-2 rounded-sm
                bg-primary text-white text-sm font-medium
                hover:bg-(--primary-hover) transition-colors
              "
              >
                <Upload size={14} />
                Index {pendingCount} file{pendingCount !== 1 ? "s" : ""}
              </button>
            )}
          </div>

          <ul className="divide-y divide-border">
            {files.map((file) => {
              const cfg = STATUS_CONFIG[file.status];
              return (
                <li
                  key={file.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-muted transition-colors"
                >
                  <div className="w-9 h-9 rounded-sm bg-primary-soft flex-center text-primary shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-text-muted hover:text-danger transition-colors p-1 rounded"
                  >
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 && (
        <div className="flex-center flex-col gap-3 py-8 text-center">
          <p className="text-body-sm">No files queued yet.</p>
        </div>
      )}
    </div>
  );
}
