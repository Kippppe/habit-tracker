"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, Pencil, Share2 } from "lucide-react";
import Link from "next/link";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { archiveHabit } from "@/app/habits/actions";
import type { Habit } from "@/lib/types/database";

interface Props {
  habit: Habit;
}

export function HabitHeader({ habit }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(async () => {
      await archiveHabit(habit.id);
      router.push("/habits");
    });
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: habit.name, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  return (
    <div className="space-y-2">
      <Link
        href="/habits"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={12} />
        習慣一覧
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Category badge */}
          {habit.category && (
            <span
              className="inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded mb-2"
              style={{
                border: "1px solid #8b2820",
                color: "#4a4640",
              }}
            >
              {habit.category}
            </span>
          )}

          {/* Habit name */}
          <h1
            className="font-serif italic font-normal tracking-tight leading-tight"
            style={{ fontSize: "clamp(28px, 5vw, 36px)" }}
          >
            {habit.name}
          </h1>

          {/* Color accent */}
          <div
            className="mt-2 h-0.5 w-12 rounded-full"
            style={{ backgroundColor: habit.color ?? "#8b2820" }}
          />
        </div>

        {/* Icon actions */}
        <div className="flex items-center gap-0.5 shrink-0 mt-1">
          <HabitFormDialog
            habit={habit}
            trigger={
              <button
                className="h-8 w-8 flex items-center justify-center rounded text-sumi-soft hover:text-foreground hover:bg-muted transition-colors"
                aria-label="編集"
              >
                <Pencil size={15} />
              </button>
            }
          />
          <button
            className="h-8 w-8 flex items-center justify-center rounded text-sumi-soft hover:text-foreground hover:bg-muted transition-colors"
            onClick={handleShare}
            aria-label="共有"
          >
            <Share2 size={15} />
          </button>
          <button
            className="h-8 w-8 flex items-center justify-center rounded text-sumi-soft hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
            onClick={handleArchive}
            disabled={isPending}
            aria-label="アーカイブ"
          >
            <Archive size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
