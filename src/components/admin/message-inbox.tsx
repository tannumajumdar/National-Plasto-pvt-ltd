"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, MailOpen, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EASE } from "@/components/animations/motion-primitives";
import { deleteMessage, markMessageRead } from "@/lib/actions/misc";
import { cn, formatDateTime } from "@/lib/utils";

export interface AdminMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function MessageInbox({ messages }: { messages: AdminMessage[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<"unread" | "all">("unread");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const visible = messages.filter((m) => (filter === "unread" ? !m.isRead : true));
  const unread = messages.filter((m) => !m.isRead).length;

  async function toggleRead(message: AdminMessage) {
    setBusyId(message.id);
    try {
      const result = await markMessageRead(message.id, !message.isRead);
      result.ok ? toast.success(result.message) : toast.error(result.message);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      const result = await deleteMessage(id);
      result.ok ? toast.success(result.message) : toast.error(result.message);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (messages.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No enquiries yet. Messages from the contact form appear here.
      </p>
    );
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        {(["unread", "all"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              filter === key
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border hover:bg-secondary",
            )}
            aria-pressed={filter === key}
          >
            {key}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs tabular-nums",
                filter === key ? "bg-white/20" : "bg-secondary",
              )}
            >
              {key === "unread" ? unread : messages.length}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nothing unread — you are all caught up.
        </p>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visible.map((message) => {
              const isOpen = expanded === message.id;
              return (
                <motion.li
                  key={message.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.24, ease: EASE }}
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    message.isRead ? "border-border" : "border-accent/35 bg-accent/5",
                  )}
                >
                  <button
                    className="flex w-full items-start justify-between gap-4 text-left"
                    onClick={() => setExpanded(isOpen ? null : message.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{message.subject}</span>
                        {!message.isRead && <Badge variant="accent">New</Badge>}
                      </span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">
                        {message.name} · {message.email}
                      </span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(message.createdAt)}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {message.message}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <a href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}>
                              <Mail />
                              Reply by email
                            </a>
                          </Button>

                          {message.phone && (
                            <Button asChild size="sm" variant="outline">
                              <a href={`tel:${message.phone}`}>
                                <Phone />
                                {message.phone}
                              </a>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            loading={busyId === message.id}
                            onClick={() => toggleRead(message)}
                          >
                            <MailOpen />
                            Mark as {message.isRead ? "unread" : "read"}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            loading={busyId === message.id}
                            onClick={() => remove(message.id)}
                          >
                            <Trash2 />
                            Delete
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </>
  );
}
