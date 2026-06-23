"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Send,
  Activity,
  Home,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  exact?: boolean;
}

const PRIMARY: NavItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview", exact: true },
];

const DATA: NavItem[] = [
  { href: "/admin/documents", icon: FileText, label: "Documents" },
  { href: "/admin/chats", icon: MessageSquare, label: "Chat logs" },
  { href: "/admin/campaigns", icon: Send, label: "Campaigns" },
];

const CONFIG: NavItem[] = [
  { href: "/admin/system", icon: Activity, label: "System" },
];

const PRODUCT_LINKS = [
  { href: "/chatbot", label: "Chatbot" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed left-3 top-3 z-30 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white p-2 shadow-sm lg:hidden dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-950",
          "lg:sticky lg:top-0 lg:z-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          >
            <Image
              src="/concentrix-logo.png"
              alt="Concentrix"
              width={28}
              height={28}
              className="rounded-md"
              priority
            />
            Concentrix Bot
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 lg:hidden dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4 text-sm">
          <Section items={PRIMARY} pathname={pathname} />
          <Section items={DATA} pathname={pathname} label="Data" />
          <Section items={CONFIG} pathname={pathname} label="Configuration" />

          <div className="mt-auto space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div>
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Live product
              </div>
              <ul className="mt-1.5 space-y-0.5">
                {PRODUCT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      <span>{l.label}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <Home className="h-3.5 w-3.5" /> Back to home
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

function Section({
  items,
  pathname,
  label,
}: {
  items: NavItem[];
  pathname: string;
  label?: string;
}) {
  return (
    <div>
      {label && (
        <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </div>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 transition",
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-brand-600 dark:text-brand-400" : "text-zinc-500",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
