// app/page.tsx
import Link from "next/link";
import { MessageSquare, Upload, Database, ArrowRight, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Grounded Chat",
    description:
      "Ask questions across your documents. Every answer is cited and confidence-aware.",
  },
  {
    icon: Upload,
    title: "Document Ingest",
    description:
      "Index PDF, Markdown, TXT, and HTML files into a local vector store.",
  },
  {
    icon: Database,
    title: "Source Management",
    description: "Browse, inspect, and manage your indexed knowledge base.",
  },
];

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-xs font-medium text-text-muted">
          <Zap size={11} className="text-primary" />
          Local-First · Private · Agentic RAG
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-text max-w-2xl leading-tight">
          Your documents, <span className="text-primary">intelligently</span>{" "}
          retrieved.
        </h1>

        <p className="text-body max-w-xl text-text-soft">
          Lumis.ai is a local-first knowledge agent. Index your files, ask
          questions, and get grounded answers — all running on your machine.
        </p>

        <div className="flex items-center gap-3 mt-2">
          <Link
            href="/chat"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] bg-primary text-white text-sm font-semibold hover:bg-[var(--primary-hover)] transition-colors"
          >
            Start Chatting
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/ingest"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] border border-border bg-surface text-sm font-medium text-text hover:bg-surface-muted transition-colors"
          >
            <Upload size={14} />
            Ingest Documents
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="surface-card flex flex-col gap-3 hover:border-primary transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-primary-soft flex-center text-primary">
                <Icon size={18} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-semibold text-text text-sm">{title}</h3>
                <p className="text-body-sm mt-1">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-4">
        <p className="text-center text-xs text-text-muted">
          lumis<span className="text-primary font-medium">.ai</span> — v0.1.0
          MVP · Runs locally
        </p>
      </footer>
    </div>
  );
}
