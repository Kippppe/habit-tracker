export type AchievementKind =
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "streak_365"
  | "day_complete"
  | "month_80";

export interface Achievement {
  kind: AchievementKind;
  habitId?: string;
  habitName?: string;
}

export interface AchievementMeta {
  kanji: string;
  title: string;
  subtitle: string;
}

export const ACHIEVEMENT_META: Record<AchievementKind, AchievementMeta> = {
  streak_7:     { kanji: "七",  title: "7 days running",   subtitle: "7日間の継続達成" },
  streak_30:    { kanji: "卅",  title: "30 days running",  subtitle: "30日間の継続達成" },
  streak_100:   { kanji: "百",  title: "100 days running", subtitle: "100日間の継続達成" },
  streak_365:   { kanji: "年",  title: "365 days running", subtitle: "1年間の継続達成" },
  day_complete: { kanji: "完",  title: "Day completed",    subtitle: "今日の全習慣を達成" },
  month_80:     { kanji: "結",  title: "Month 80%+",       subtitle: "今月80%以上を達成" },
};
