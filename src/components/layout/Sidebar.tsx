// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Upload,
  Database,
  FlaskConical,
  Zap,
} from "lucide-react";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/ingest", label: "Ingest", icon: Upload },
  { href: "/eval", label: "Evaluation", icon: FlaskConical },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col border-r border-border bg-surface z-40"
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-1 px-6 py-5 border-b border-border">
        <div className="w-14 h-14 rounded-[var(--radius-sm)] flex-center">
          <Image
            src={"/appIcon.png"}
            alt="appIcon"
            width={80}
            height={80}
          ></Image>
        </div>
        <span className="font-bold text-title-3 tracking-tight text-text">
          LUMIS<span className="text-primary">.ai</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)]
                text-sm font-medium transition-all duration-150
                ${
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-soft hover:bg-accent-soft hover:text-text"
                }
              `}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-[var(--radius-sm)] hover:bg-accent-soft cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary-soft flex-center text-primary font-bold text-sm">
            L
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate">Lumis User</p>
            <p className="text-xs text-text-muted truncate">v0.1.0 — MVP</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
