import { toZonedTime } from "date-fns-tz";

const TZ = "Asia/Tokyo";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toJSTDateStr(date: Date): string {
  const d = toZonedTime(date, TZ);
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}-` +
    `${String(d.getDate()).padStart(2, "0")}`
  );
}

export function getTodayJST(): string {
  return toJSTDateStr(new Date());
}

/** dateStr (YYYY-MM-DD) を UTC midnight として days 日シフト */
export function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * weekOffset=0: today を右端とした 7 日間
 * weekOffset=-1: その前の 7 日間
 */
export function getWeekDates(weekOffset: number, todayJST: string): string[] {
  const endDate = shiftDate(todayJST, weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => shiftDate(endDate, -(6 - i)));
}

export function getDayHeader(dateStr: string): { abbr: string; date: number } {
  const d = new Date(dateStr + "T00:00:00Z");
  return { abbr: DAY_ABBR[d.getUTCDay()], date: d.getUTCDate() };
}
