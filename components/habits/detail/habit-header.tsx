"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { archiveHabit } from "@/app/habits/actions";
import type { Habit } from "@/lib/types/database";

const DIFFICULTY_LABEL: Record<number, string> = {
  1: "簡単",
  2: "普通",
  3: "難しい",
};

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

  return (
    <div className="space-y-3">
      <Link
        href="/habits"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        習慣一覧
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-1 mt-1 self-stretch rounded-full shrink-0"
            style={{ backgroundColor: habit.color ?? "#8b2820", minHeight: "2rem" }}
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-serif font-normal tracking-tight truncate">
              {habit.name}
            </h1>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {habit.category && (
                <span className="text-xs bg-muted text-muted-foreground rounded px-2 py-0.5">
                  {habit.category}
                </span>
              )}
              <span className="text-xs bg-muted text-muted-foreground rounded px-2 py-0.5">
                {DIFFICULTY_LABEL[habit.difficulty_level] ?? ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <HabitFormDialog
            habit={habit}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="rounded h-8 px-3 text-xs"
              >
                編集
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded text-muted-foreground hover:text-foreground"
            onClick={handleArchive}
            disabled={isPending}
            aria-label="アーカイブ"
          >
            <Archive size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
