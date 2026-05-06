import { createClient } from "@/lib/supabase/server";
import { getTodayJST, shiftDate } from "@/utils/date";
import { TodayDashboard } from "@/components/today/today-dashboard";

export default async function TodayPage() {
  const todayJST = getTodayJST();
  const since = shiftDate(todayJST, -364);

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
      .gte("date", since)
      .lte("date", todayJST),
  ]);

  return (
    <TodayDashboard
      habits={habits ?? []}
      initialCheckIns={checkIns ?? []}
      todayJST={todayJST}
      since={since}
    />
  );
}
