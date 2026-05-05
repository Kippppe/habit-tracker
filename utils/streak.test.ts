import { describe, it, expect } from "vitest";
import {
  calculateDailyStreak,
  calculateWeeklyStreak,
  getStreak,
} from "./streak";

// today = 2024-06-15 (土曜日)
// 今週月曜 = 2024-06-10
// 先週月曜 = 2024-06-03
// 先々週月曜 = 2024-05-27
const TODAY = "2024-06-15";

// ─── calculateDailyStreak ────────────────────────────────────────────────────

describe("calculateDailyStreak", () => {
  it("空配列 → 0", () => {
    expect(calculateDailyStreak([], TODAY)).toBe(0);
  });

  it("今日のみチェック → 1", () => {
    expect(calculateDailyStreak(["2024-06-15"], TODAY)).toBe(1);
  });

  it("今日含む3日連続 → 3", () => {
    const dates = ["2024-06-13", "2024-06-14", "2024-06-15"];
    expect(calculateDailyStreak(dates, TODAY)).toBe(3);
  });

  it("昨日まで連続・今日未チェック → 連続維持 (3)", () => {
    const dates = ["2024-06-12", "2024-06-13", "2024-06-14"];
    expect(calculateDailyStreak(dates, TODAY)).toBe(3);
  });

  it("一昨日チェック・昨日抜け・今日チェック → 1（連続途切れ）", () => {
    const dates = ["2024-06-13", "2024-06-15"]; // 6/14 なし
    expect(calculateDailyStreak(dates, TODAY)).toBe(1);
  });

  it("今日も昨日もなし → 0", () => {
    const dates = ["2024-06-10", "2024-06-11", "2024-06-12"];
    expect(calculateDailyStreak(dates, TODAY)).toBe(0);
  });

  it("途中に空白があればそこで止まる", () => {
    // 6/13 が抜けている → 6/14, 6/15 の 2 日のみ
    const dates = ["2024-06-11", "2024-06-12", "2024-06-14", "2024-06-15"];
    expect(calculateDailyStreak(dates, TODAY)).toBe(2);
  });

  it("月跨ぎ連続が正しく動く (5/31 → 6/02)", () => {
    const dates = ["2024-05-31", "2024-06-01", "2024-06-02"];
    expect(calculateDailyStreak(dates, "2024-06-02")).toBe(3);
  });

  it("年跨ぎ連続が正しく動く (12/31 → 1/02)", () => {
    const dates = ["2023-12-31", "2024-01-01", "2024-01-02"];
    expect(calculateDailyStreak(dates, "2024-01-02")).toBe(3);
  });
});

// ─── calculateWeeklyStreak ───────────────────────────────────────────────────

describe("calculateWeeklyStreak", () => {
  it("空配列 → 0", () => {
    expect(calculateWeeklyStreak([], 3, TODAY)).toBe(0);
  });

  it("target=3: 今週 2 回 → 0（未達は保留、過去週なし）", () => {
    expect(calculateWeeklyStreak(["2024-06-10", "2024-06-11"], 3, TODAY)).toBe(0);
  });

  it("target=3: 今週 3 回 → 1", () => {
    const dates = ["2024-06-10", "2024-06-11", "2024-06-12"];
    expect(calculateWeeklyStreak(dates, 3, TODAY)).toBe(1);
  });

  it("今週 3 回 + 先週 3 回 + 先々週 2 回 → 2", () => {
    const dates = [
      "2024-05-27", "2024-05-28", // 先々週 2 回（未達）
      "2024-06-03", "2024-06-04", "2024-06-05", // 先週 3 回
      "2024-06-10", "2024-06-11", "2024-06-12", // 今週 3 回
    ];
    expect(calculateWeeklyStreak(dates, 3, TODAY)).toBe(2);
  });

  it("今週未達・先週達成・先々週達成 → 2（保留で過去連続を維持）", () => {
    const dates = [
      "2024-05-27", "2024-05-28", "2024-05-29", // 先々週 3 回
      "2024-06-03", "2024-06-04", "2024-06-05", // 先週 3 回
      "2024-06-10", // 今週 1 回（未達）
    ];
    expect(calculateWeeklyStreak(dates, 3, TODAY)).toBe(2);
  });

  it("target=1: 今週 1 回でも → 1", () => {
    expect(calculateWeeklyStreak(["2024-06-10"], 1, TODAY)).toBe(1);
  });

  it("先週未達 → 今週分のみ (1)", () => {
    const dates = [
      "2024-06-03", // 先週 1 回（未達）
      "2024-06-10", "2024-06-11", "2024-06-12", // 今週 3 回
    ];
    expect(calculateWeeklyStreak(dates, 3, TODAY)).toBe(1);
  });

  it("月跨ぎ週が正しく動く (5/27 週に 3 回)", () => {
    // 先々週 = 2024-05-27 Mon
    const dates = [
      "2024-05-27", "2024-05-28", "2024-05-29",
      "2024-06-03", "2024-06-04", "2024-06-05",
    ];
    expect(calculateWeeklyStreak(dates, 3, "2024-06-07")).toBe(2);
  });

  it("年跨ぎ週が正しく動く", () => {
    // 2024-01-01 は月曜日 → 週 2023-12-25 に属する（Mon start）
    // 2023-12-25 週に 3 回
    const dates = ["2023-12-25", "2023-12-26", "2023-12-27"];
    expect(calculateWeeklyStreak(dates, 3, "2024-01-01")).toBe(1);
  });
});

// ─── getStreak ───────────────────────────────────────────────────────────────

describe("getStreak", () => {
  it("target_per_week=7 → calculateDailyStreak に委譲", () => {
    const dates = ["2024-06-14", "2024-06-15"];
    expect(getStreak({ target_per_week: 7 }, dates, TODAY)).toBe(2);
  });

  it("target_per_week=3 → calculateWeeklyStreak に委譲", () => {
    const dates = ["2024-06-10", "2024-06-11", "2024-06-12"];
    expect(getStreak({ target_per_week: 3 }, dates, TODAY)).toBe(1);
  });

  it("target_per_week=1 → 週 1 回達成で 1", () => {
    expect(getStreak({ target_per_week: 1 }, ["2024-06-10"], TODAY)).toBe(1);
  });
});
