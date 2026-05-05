import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { habitId, date, action } = body as {
    habitId: string;
    date: string;
    action: "upsert" | "delete";
  };

  if (!habitId || !date || !action) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (action === "upsert") {
    const { error } = await supabase.from("check_ins").upsert(
      { habit_id: habitId, user_id: user.id, date },
      { onConflict: "habit_id,date" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("check_ins")
      .delete()
      .eq("habit_id", habitId)
      .eq("date", date)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
