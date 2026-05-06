"use client";

import { useTransition } from "react";
import { Pencil, Archive, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { archiveHabit, restoreHabit } from "@/app/habits/actions";
import type { Habit } from "@/lib/types/database";

const FREQUENCY_LABEL: Record<number, string> = {
  7: "毎日",
  6: "週6日",
  5: "週5日",
  4: "週4日",
  3: "週3日",
  2: "週2日",
  1: "週1日",
};

const DIFFICULTY_LABEL: Record<number, string> = {
  1: "簡単",
  2: "普通",
  3: "難しい",
};

interface Props {
  habit: Habit;
  archived?: boolean;
}

export function HabitCard({ habit, archived = false }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(() => archiveHabit(habit.id));
  }

  function handleRestore() {
    startTransition(() => restoreHabit(habit.id));
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-md bg-card border border-border px-4 py-3 shadow-sm transition-opacity ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: habit.color ?? "#8b2820" }}
      />

      <div className="flex-1 min-w-0">
        <Link
          href={`/habits/${habit.id}`}
          className="font-medium text-foreground truncate hover:text-primary transition-colors block"
        >
          {habit.name}
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">
          {FREQUENCY_LABEL[habit.target_per_week] ?? `週${habit.target_per_week}日`}
          {" · "}
          {DIFFICULTY_LABEL[habit.difficulty_level] ?? ""}
          {habit.category && ` · ${habit.category}`}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {archived ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded text-muted-foreground hover:text-foreground"
            onClick={handleRestore}
            disabled={isPending}
            aria-label="復元"
          >
            <RotateCcw size={15} />
          </Button>
        ) : (
          <>
            <HabitFormDialog
              habit={habit}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded text-muted-foreground hover:text-foreground"
                  aria-label="編集"
                >
                  <Pencil size={15} />
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
          </>
        )}
      </div>
    </div>
  );
}
