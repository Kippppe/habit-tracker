import { parseISO, format, subDays, subWeeks, startOfWeek } from "date-fns";

function toDate(dateStr: string): Date {
  return parseISO(dateStr);
}

function toStr(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** ISO 週の月曜日 (YYYY-MM-DD) を返す */
function weekMon(dateStr: string): string {
  return toStr(startOfWeek(toDate(dateStr), { weekStartsOn: 1 }));
}

/**
 * 毎日チェック習慣のストリーク日数。
 * 今日チェック済み → 今日から遡る。
 * 今日未チェック → 昨日から遡る（連続を維持）。
 */
export function calculateDailyStreak(
  checkInDates: string[],
  today: string
): number {
  const dateSet = new Set(checkInDates);

  let current: string;
  if (dateSet.has(today)) {
    current = today;
  } else {
    const yesterday = toStr(subDays(toDate(today), 1));
    if (dateSet.has(yesterday)) {
      current = yesterday;
    } else {
      return 0;
    }
  }

  let streak = 0;
  while (dateSet.has(current)) {
    streak++;
    current = toStr(subDays(toDate(current), 1));
  }
  return streak;
}

/**
 * 週単位チェック習慣のストリーク週数。
 * 今週が targetPerWeek 以上 → 今週を 1 としてカウント。
 * 今週が未達 → 保留扱い（0 に落とさず、過去の連続週数を維持）。
 * 過去週を遡り、連続して達成している週数を加算する。
 */
export function calculateWeeklyStreak(
  checkInDates: string[],
  targetPerWeek: number,
  today: string
): number {
  // 週ごとのチェックイン数を集計
  const weekCounts = new Map<string, number>();
  for (const d of checkInDates) {
    const ws = weekMon(d);
    weekCounts.set(ws, (weekCounts.get(ws) ?? 0) + 1);
  }

  const currentWs = weekMon(today);
  const thisWeekDone = (weekCounts.get(currentWs) ?? 0) >= targetPerWeek ? 1 : 0;

  // 先週から遡って連続達成週数をカウント
  let pastStreak = 0;
  let ws = toStr(subWeeks(toDate(currentWs), 1));
  while (true) {
    if ((weekCounts.get(ws) ?? 0) >= targetPerWeek) {
      pastStreak++;
      ws = toStr(subWeeks(toDate(ws), 1));
    } else {
      break;
    }
    if (pastStreak > 10_000) break;
  }

  return thisWeekDone + pastStreak;
}

/**
 * target_per_week に応じてストリーク計算を委譲する。
 */
export function getStreak(
  habit: { target_per_week: number },
  checkInDates: string[],
  today: string
): number {
  return habit.target_per_week === 7
    ? calculateDailyStreak(checkInDates, today)
    : calculateWeeklyStreak(checkInDates, habit.target_per_week, today);
}
