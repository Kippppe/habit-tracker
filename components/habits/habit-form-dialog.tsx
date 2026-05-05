"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createHabit, updateHabit } from "@/app/habits/actions";
import type { Habit } from "@/lib/types/database";

const PRESET_COLORS = [
  "#d97706", "#ef4444", "#3b82f6", "#10b981",
  "#8b5cf6", "#f97316", "#ec4899", "#6b7280",
];

const DAYS = [
  { value: "7", label: "毎日 (7日)" },
  { value: "6", label: "週6日" },
  { value: "5", label: "週5日" },
  { value: "4", label: "週4日" },
  { value: "3", label: "週3日" },
  { value: "2", label: "週2日" },
  { value: "1", label: "週1日" },
];

const DIFFICULTY = [
  { value: "1", label: "簡単" },
  { value: "2", label: "普通" },
  { value: "3", label: "難しい" },
];

interface Props {
  habit?: Habit;
  trigger: React.ReactNode;
}

export function HabitFormDialog({ habit, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(habit?.name ?? "");
  const [category, setCategory] = useState(habit?.category ?? "");
  const [targetPerWeek, setTargetPerWeek] = useState(
    String(habit?.target_per_week ?? 7)
  );
  const [difficultyLevel, setDifficultyLevel] = useState(
    String(habit?.difficulty_level ?? 1)
  );
  const [color, setColor] = useState(habit?.color ?? "#d97706");

  function reset() {
    setName(habit?.name ?? "");
    setCategory(habit?.category ?? "");
    setTargetPerWeek(String(habit?.target_per_week ?? 7));
    setDifficultyLevel(String(habit?.difficulty_level ?? 1));
    setColor(habit?.color ?? "#d97706");
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      category: category || null,
      target_per_week: Number(targetPerWeek),
      difficulty_level: Number(difficultyLevel),
      color,
    };
    startTransition(async () => {
      if (habit) {
        await updateHabit(habit.id, payload);
      } else {
        await createHabit(payload);
      }
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle>{habit ? "習慣を編集" : "習慣を追加"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">習慣名 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 30分読書"
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">カテゴリ</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例: 健康、学習"
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>目標頻度</Label>
              <Select value={targetPerWeek} onValueChange={setTargetPerWeek}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>難易度</Label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>カラー</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                  style={{ backgroundColor: c }}
                  aria-label={c}
                >
                  {color === c && (
                    <span className="flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl"
              disabled={isPending || !name.trim()}
            >
              {isPending ? "保存中…" : "保存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
