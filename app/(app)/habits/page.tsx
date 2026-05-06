import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { HabitCard } from "@/components/habits/habit-card";

export default async function HabitsPage() {
  const supabase = await createClient();
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .order("created_at", { ascending: true });

  const active = habits?.filter((h) => !h.archived_at) ?? [];
  const archived = habits?.filter((h) => h.archived_at) ?? [];

  // Group active habits by category
  const categories = Array.from(
    new Set(active.map((h) => h.category ?? ""))
  );

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">習慣</h1>
        <HabitFormDialog
          trigger={
            <Button className="rounded gap-1.5">
              <Plus size={16} />
              追加
            </Button>
          }
        />
      </div>

      {active.length === 0 && (
        <p className="text-muted-foreground text-sm py-8 text-center">
          まだ習慣がありません。「追加」から始めましょう。
        </p>
      )}

      {categories.map((cat) => {
        const group = active.filter((h) => (h.category ?? "") === cat);
        return (
          <section key={cat} className="space-y-2">
            {cat && (
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                {cat}
              </h2>
            )}
            {group.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </section>
        );
      })}

      {archived.length > 0 && (
        <section className="space-y-2 pt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            アーカイブ済み
          </h2>
          {archived.map((habit) => (
            <HabitCard key={habit.id} habit={habit} archived />
          ))}
        </section>
      )}
    </div>
  );
}
