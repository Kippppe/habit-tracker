import { toJSTDateStr } from "@/utils/date";

const TZ = "Asia/Tokyo";

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function weekStartStr(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const dow = d.getUTCDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() + daysToMon);
  return mon.toISOString().slice(0, 10);
}

function prevWeekStart(ws: string): string {
  const d = new Date(ws + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

/**
 * 毎日チェック習慣のストリーク日数。
 * 今日未チェックでも昨日まで連続していれば維持する。
 */
export function calculateDailyStreak(checkIns: Date[], today: Date): number {
  if (checkIns.length === 0) return 0;

  const dateSet = new Set(checkIns.map(toJSTDateStr));
  const todayStr = toJSTDateStr(today);
  const yesterdayStr = prevDay(todayStr);

  let current: string;
  if (dateSet.has(todayStr)) {
    current = todayStr;
  } else if (dateSet.has(yesterdayStr)) {
    current = yesterdayStr;
  } else {
    return 0;
  }

  let streak = 0;
  while (dateSet.has(current)) {
    streak++;
    current = prevDay(current);
  }
  return streak;
}

/**
 * 週単位チェック習慣のストリーク週数。
 * 今週が目標達成済みならその週から、未達成（進行中）なら前週から遡る。
 */
export function calculateWeeklyStreak(
  checkIns: Date[],
  targetPerWeek: number,
  today: Date
): number {
  if (checkIns.length === 0) return 0;

  const todayStr = toJSTDateStr(today);
  const currentWs = weekStartStr(todayStr);

  const weekCounts = new Map<string, number>();
  for (const ci of checkIns) {
    const ws = weekStartStr(toJSTDateStr(ci));
    weekCounts.set(ws, (weekCounts.get(ws) ?? 0) + 1);
  }

  const thisWeekCount = weekCounts.get(currentWs) ?? 0;
  let ws =
    thisWeekCount >= targetPerWeek ? currentWs : prevWeekStart(currentWs);

  let streak = 0;
  while (true) {
    const count = weekCounts.get(ws) ?? 0;
    if (count >= targetPerWeek) {
      streak++;
      ws = prevWeekStart(ws);
    } else {
      break;
    }
    if (streak > 10_000) break;
  }
  return streak;
}

export function getStreak(
  checkIns: Date[],
  targetPerWeek: number,
  today: Date
): number {
  return targetPerWeek === 7
    ? calculateDailyStreak(checkIns, today)
    : calculateWeeklyStreak(checkIns, targetPerWeek, today);
}
