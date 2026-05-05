import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json([], { status: 400 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("check_ins")
    .select("*")
    .gte("date", start)
    .lte("date", end);

  return NextResponse.json(data ?? []);
}
