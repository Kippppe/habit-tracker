import { createClient } from "@/lib/supabase/server";
import { getTodayJST, getWeekDates } from "@/utils/date";
import { HabitGrid } from "@/components/today/habit-grid";

interface Props {
  searchParams: Promise<{ w?: string }>;
}

export default async function TodayPage({ searchParams }: Props) {
  const { w } = await searchParams;
  const weekOffset = Math.min(0, parseInt(w ?? "0", 10) || 0);

  const todayJST = getTodayJST();
  const days = getWeekDates(weekOffset, todayJST);
  const startDate = days[0];
  const endDate = days[6];

  const supabase = await createClient();
  const [{ data: habits }, { data: checkIns }] = await Promise.all([
    supabase
      .from("habits")
      .select("*")
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("check_ins")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate),
  ]);

  return (
    <HabitGrid
      habits={habits ?? []}
      initialCheckIns={checkIns ?? []}
      days={days}
      todayJST={todayJST}
      weekOffset={weekOffset}
    />
  );
}
