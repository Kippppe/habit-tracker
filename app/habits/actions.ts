"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { HabitInsert, HabitUpdate } from "@/lib/types/database";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

function revalidate() {
  revalidatePath("/habits");
  revalidatePath("/today");
}

export async function createHabit(
  data: Omit<HabitInsert, "user_id">
) {
  const { supabase, user } = await getAuthUser();
  const { error } = await supabase
    .from("habits")
    .insert({ ...data, user_id: user.id });
  if (error) throw error;
  revalidate();
}

export async function updateHabit(id: string, data: HabitUpdate) {
  const { supabase, user } = await getAuthUser();
  const { error } = await supabase
    .from("habits")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidate();
}

export async function archiveHabit(id: string) {
  const { supabase, user } = await getAuthUser();
  const { error } = await supabase
    .from("habits")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidate();
}

export async function restoreHabit(id: string) {
  const { supabase, user } = await getAuthUser();
  const { error } = await supabase
    .from("habits")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidate();
}
