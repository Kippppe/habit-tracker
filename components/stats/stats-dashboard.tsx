import { GoalBarChart } from "@/components/charts/goal-bar-chart";
import { Hanko } from "@/components/brand/hanko";
import type {
  DailyRhythmPoint,
  MilestoneAchievement,
} from "@/app/(app)/stats/page";

// ── Section chrome ────────────────────────────────────────────────────────────

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <p className="font-mono text-[11px] text-shu uppercase tracking-[0.15em] mb-2">
      {num} / {label}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[22px] font-normal tracking-tight leading-tight mb-4">
      {children}
    </h2>
  );
}

// ── Section 1: Daily Rhythm ───────────────────────────────────────────────────

function DailyRhythmSection({
  data,
  avgPerDay,
  goalLine,
}: {
  data: DailyRhythmPoint[];
  avgPerDay: number;
  goalLine: number;
}) {
  return (
    <section>
      <SectionLabel num="01" label="DAILY RHYTHM" />
      <SectionTitle>
        毎日の<em>リズム</em>
      </SectionTitle>
      <div className="rounded-md bg-card border border-border shadow-sm p-4">
        <GoalBarChart data={data} goalLine={goalLine} height={160} />
        <p className="text-xs text-sumi-soft dark:text-line font-sans mt-2 tabular-nums">
          average{" "}
          <span className="font-medium text-foreground">{avgPerDay}</span> habits
          / day
        </p>
      </div>
    </section>
  );
}

// ── Section 2: Milestones ─────────────────────────────────────────────────────

function MilestonesSection({ milestones }: { milestones: MilestoneAchievement[] }) {
  if (milestones.length === 0) return null;

  function formatDate(d: string) {
    const y = d.slice(0, 4);
    const m = parseInt(d.slice(5, 7), 10);
    const day = parseInt(d.slice(8, 10), 10);
    return `${y}年${m}月${day}日`;
  }

  return (
    <section>
      <SectionLabel num="02" label="MILESTONES" />
      <SectionTitle>
        達成した<em>記念日</em>
      </SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {milestones.map((ms, i) => (
          <div
            key={`${ms.habitId}-${ms.milestone}`}
            className="rounded-md bg-card border border-border shadow-sm p-4 flex flex-col items-center gap-2 text-center"
          >
            <Hanko size={56} text={ms.milestoneKanji} tilted={i % 3 !== 0} weathered />
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                {ms.milestone} days
              </p>
              <p className="text-sm font-medium mt-0.5 leading-tight">{ms.habitName}</p>
              <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                {formatDate(ms.achievedDate)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  dailyRhythm: DailyRhythmPoint[];
  avgPerDay: number;
  milestones: MilestoneAchievement[];
  goalLine: number;
  hasHabits: boolean;
}

export function StatsDashboard({
  dailyRhythm,
  avgPerDay,
  milestones,
  goalLine,
  hasHabits,
}: Props) {
  return (
    <div className="py-6 space-y-14">
      {!hasHabits ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          習慣を追加すると統計が表示されます。
        </p>
      ) : (
        <>
          <DailyRhythmSection data={dailyRhythm} avgPerDay={avgPerDay} goalLine={goalLine} />
          <MilestonesSection milestones={milestones} />
        </>
      )}
    </div>
  );
}
