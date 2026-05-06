"use server";

import { createClient } from "@/lib/supabase/server";
import { shiftDate } from "@/utils/date";
import { getStreak } from "@/utils/streak";
import type { Achievement, AchievementKind } from "@/lib/types/achievements";

// ── Milestone dedup helper ────────────────────────────────────────────────────

async function tryRecordMilestone(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  habitId: string | null,
  type: AchievementKind,
  achievedDate: string
): Promise<boolean> {
  // Check for existing same-day milestone
  let q = supabase
    .from("milestones")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId)
    .eq("type", type)
    .eq("achieved_date", achievedDate);

  q = habitId ? q.eq("habit_id", habitId) : q.is("habit_id", null);

  const { count } = await q;
  if ((count ?? 0) > 0) return false;

  const { error } = await supabase.from("milestones").insert({
    user_id: userId,
    habit_id: habitId,
    type,
    achieved_date: achievedDate,
  });

  return !error;
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function upsertCheckIn(
  habitId: string,
  date: string
): Promise<{ achievement?: Achievement }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Insert check-in
  const { error: upsertError } = await supabase.from("check_ins").upsert(
    { habit_id: habitId, user_id: user.id, date },
    { onConflict: "habit_id,date" }
  );
  if (upsertError) throw upsertError;

  // 2. Parallel fetch for achievement detection
  const [
    { data: habit },
    { data: habitCheckIns },
    { data: allHabits },
    { data: todayCheckIns },
  ] = await Promise.all([
    supabase.from("habits").select("*").eq("id", habitId).single(),
    supabase
      .from("check_ins")
      .select("date")
      .eq("habit_id", habitId)
      .gte("date", shiftDate(date, -365))
      .lte("date", date),
    supabase.from("habits").select("id").is("archived_at", null),
    supabase.from("check_ins").select("habit_id", { head: false }).eq("date", date),
  ]);

  if (!habit || !habitCheckIns) return {};

  // 3. Check streak milestones (highest first — only fire one per check-in)
  const checkInDates = habitCheckIns.map((ci: { date: string }) => ci.date);
  const streak = getStreak(habit, checkInDates, date);

  const STREAK_MILESTONES: { threshold: number; kind: AchievementKind }[] = [
    { threshold: 365, kind: "streak_365" },
    { threshold: 100, kind: "streak_100" },
    { threshold: 30, kind: "streak_30" },
    { threshold: 7, kind: "streak_7" },
  ];

  for (const { threshold, kind } of STREAK_MILESTONES) {
    if (streak >= threshold) {
      const recorded = await tryRecordMilestone(supabase, user.id, habitId, kind, date);
      if (recorded) {
        return { achievement: { kind, habitId, habitName: habit.name } };
      }
      break; // only fire the highest applicable milestone
    }
  }

  // 4. Check day complete (all active habits done today)
  const habitCount = allHabits?.length ?? 0;
  const todayDone = todayCheckIns?.length ?? 0;
  if (habitCount > 0 && todayDone >= habitCount) {
    const recorded = await tryRecordMilestone(supabase, user.id, null, "day_complete", date);
    if (recorded) return { achievement: { kind: "day_complete" } };
  }

  // 5. Check month 80%+
  const monthStart = `${date.slice(0, 7)}-01`;
  const { data: monthCheckIns } = await supabase
    .from("check_ins")
    .select("id", { head: false, count: "exact" })
    .gte("date", monthStart)
    .lte("date", date);

  const dayOfMonth = parseInt(date.slice(8, 10), 10);
  const expectedMonthly = habitCount * dayOfMonth;
  const actualMonthly = (monthCheckIns as unknown[])?.length ?? 0;
  const monthPct =
    expectedMonthly > 0 ? Math.round((actualMonthly / expectedMonthly) * 100) : 0;

  if (monthPct >= 80) {
    const recorded = await tryRecordMilestone(
      supabase, user.id, null, "month_80", monthStart
    );
    if (recorded) return { achievement: { kind: "month_80" } };
  }

  return {};
}

export async function deleteCheckIn(habitId: string, date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("check_ins")
    .delete()
    .eq("habit_id", habitId)
    .eq("date", date)
    .eq("user_id", user.id);
  if (error) throw error;
}
