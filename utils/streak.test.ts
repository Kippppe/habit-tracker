import { describe, it, expect } from "vitest";
import {
  calculateDailyStreak,
  calculateWeeklyStreak,
  getStreak,
} from "./streak";

/** YYYY-MM-DD → Date (UTC midnight; JST 09:00) */
function d(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00Z");
}

const TODAY = d("2024-06-15"); // 土曜日

// ─── calculateDailyStreak ────────────────────────────────────────────────────

describe("calculateDailyStreak", () => {
  it("空配列は 0", () => {
    expect(calculateDailyStreak([], TODAY)).toBe(0);
  });

  it("今日だけチェック → 1", () => {
    expect(calculateDailyStreak([d("2024-06-15")], TODAY)).toBe(1);
  });

  it("今日と昨日 → 2", () => {
    const checkIns = [d("2024-06-14"), d("2024-06-15")];
    expect(calculateDailyStreak(checkIns, TODAY)).toBe(2);
  });

  it("5日連続（今日含む）→ 5", () => {
    const checkIns = [
      d("2024-06-11"),
      d("2024-06-12"),
      d("2024-06-13"),
      d("2024-06-14"),
      d("2024-06-15"),
    ];
    expect(calculateDailyStreak(checkIns, TODAY)).toBe(5);
  });

  it("今日未チェック・昨日チェック済み → ストリーク維持 (3)", () => {
    const checkIns = [
      d("2024-06-12"),
      d("2024-06-13"),
      d("2024-06-14"), // 昨日
      // 今日(15)はなし
    ];
    expect(calculateDailyStreak(checkIns, TODAY)).toBe(3);
  });

  it("今日も昨日もなし → 0", () => {
    const checkIns = [d("2024-06-10"), d("2024-06-11"), d("2024-06-12")];
    expect(calculateDailyStreak(checkIns, TODAY)).toBe(0);
  });

  it("途中に空白があればそこで止まる", () => {
    // 6/13 が抜けている → 6/14, 6/15 の 2 日のみ
    const checkIns = [
      d("2024-06-11"),
      d("2024-06-12"),
      // 6/13 欠落
      d("2024-06-14"),
      d("2024-06-15"),
    ];
    expect(calculateDailyStreak(checkIns, TODAY)).toBe(2);
  });

  it("今日1件だけで昨日なし → 1", () => {
    expect(calculateDailyStreak([d("2024-06-15")], TODAY)).toBe(1);
  });
});

// ─── calculateWeeklyStreak ───────────────────────────────────────────────────

// 今週 Mon = 2024-06-10, 今日 = 2024-06-15 (Sat)
// 先週 Mon = 2024-06-03 〜 Sun 2024-06-09
// 先々週 = 2024-05-27 〜 2024-06-02

describe("calculateWeeklyStreak", () => {
  it("空配列は 0", () => {
    expect(calculateWeeklyStreak([], 3, TODAY)).toBe(0);
  });

  it("今週だけ目標達成 → 1", () => {
    const checkIns = [
      d("2024-06-10"),
      d("2024-06-11"),
      d("2024-06-12"),
    ];
    expect(calculateWeeklyStreak(checkIns, 3, TODAY)).toBe(1);
  });

  it("今週未達成・先週達成 → 1", () => {
    const checkIns = [
      d("2024-06-03"),
      d("2024-06-04"),
      d("2024-06-05"), // 先週 3 回達成
      d("2024-06-10"), // 今週 1 回のみ（未達成）
    ];
    expect(calculateWeeklyStreak(checkIns, 3, TODAY)).toBe(1);
  });

  it("今週達成・先週達成 → 2", () => {
    const checkIns = [
      d("2024-06-03"),
      d("2024-06-04"),
      d("2024-06-05"), // 先週 3 回
      d("2024-06-10"),
      d("2024-06-11"),
      d("2024-06-12"), // 今週 3 回
    ];
    expect(calculateWeeklyStreak(checkIns, 3, TODAY)).toBe(2);
  });

  it("3週連続達成 → 3", () => {
    const checkIns = [
      // 先々週
      d("2024-05-27"),
      d("2024-05-28"),
      d("2024-05-29"),
      // 先週
      d("2024-06-03"),
      d("2024-06-04"),
      d("2024-06-05"),
      // 今週
      d("2024-06-10"),
      d("2024-06-11"),
      d("2024-06-12"),
    ];
    expect(calculateWeeklyStreak(checkIns, 3, TODAY)).toBe(3);
  });

  it("先週未達成 → 今週のみカウント (1)", () => {
    const checkIns = [
      d("2024-06-03"), // 先週 1 回のみ（未達成）
      d("2024-06-10"),
      d("2024-06-11"),
      d("2024-06-12"), // 今週達成
    ];
    expect(calculateWeeklyStreak(checkIns, 3, TODAY)).toBe(1);
  });

  it("target=1: 今週に 1 回でも → 1", () => {
    expect(calculateWeeklyStreak([d("2024-06-10")], 1, TODAY)).toBe(1);
  });

  it("今週が完全に空・先週も空 → 0", () => {
    const checkIns = [d("2024-05-20")]; // 3週以上前
    expect(calculateWeeklyStreak(checkIns, 3, TODAY)).toBe(0);
  });
});

// ─── getStreak ───────────────────────────────────────────────────────────────

describe("getStreak", () => {
  it("targetPerWeek=7 → calculateDailyStreak に委譲", () => {
    const checkIns = [d("2024-06-14"), d("2024-06-15")];
    expect(getStreak(checkIns, 7, TODAY)).toBe(2);
  });

  it("targetPerWeek=3 → calculateWeeklyStreak に委譲", () => {
    const checkIns = [
      d("2024-06-10"),
      d("2024-06-11"),
      d("2024-06-12"),
    ];
    expect(getStreak(checkIns, 3, TODAY)).toBe(1);
  });
});
