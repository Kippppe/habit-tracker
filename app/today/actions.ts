"use server";

import { createClient } from "@/lib/supabase/server";

export async function upsertCheckIn(habitId: string, date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("check_ins").upsert(
    { habit_id: habitId, user_id: user.id, date },
    { onConflict: "habit_id,date" }
  );
  if (error) throw error;
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
