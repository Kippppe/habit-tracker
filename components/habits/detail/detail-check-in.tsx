"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { upsertCheckIn, deleteCheckIn } from "@/app/today/actions";

export interface RecordDay {
  date: string;
  dow: string;
  dayNum: number;
  checked: boolean;
  isToday: boolean;
}

interface Props {
  habitId: string;
  days: RecordDay[];
}

export function DetailCheckIn({ habitId, days }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  function toggle(date: string, checked: boolean) {
    setPendingDate(date);
    startTransition(async () => {
      try {
        if (checked) await deleteCheckIn(habitId, date);
        else await upsertCheckIn(habitId, date);
        router.refresh();
      } finally {
        setPendingDate(null);
      }
    });
  }

  return (
    <div className="flex gap-1.5">
      {days.map((d) => (
        <button
          key={d.date}
          type="button"
          onClick={() => toggle(d.date, d.checked)}
          disabled={isPending}
          aria-pressed={d.checked}
          aria-label={`${d.dayNum}日を${d.checked ? "未完了に戻す" : "完了にする"}`}
          className={cn(
            "flex-1 flex flex-col items-center gap-1.5 rounded-md border py-2.5 transition-colors disabled:cursor-not-allowed",
            d.checked
              ? "bg-primary/10 border-primary/30"
              : "bg-card border-border hover:border-primary/30",
            pendingDate === d.date && "opacity-50"
          )}
        >
          <span
            className={cn(
              "text-[10px] font-mono",
              d.isToday ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            {d.dow}
          </span>
          <span
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-xs tabular-nums transition-colors",
              d.checked
                ? "bg-primary text-primary-foreground"
                : "bg-foreground/5 text-muted-foreground"
            )}
          >
            {d.checked ? <Check size={14} /> : d.dayNum}
          </span>
        </button>
      ))}
    </div>
  );
}
