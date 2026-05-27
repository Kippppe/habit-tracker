# UX Overhaul — Design Spec

**Date:** 2026-05-27
**Status:** Approved direction, pending spec review
**Scope:** 5 UX problems on the kipwork habit tracker (/today, /habits, /habits/[id], /stats)

## Problem summary

| # | Problem | Severity | Root cause |
|---|---------|----------|------------|
| 1 | Huge 0%/Streak-0 display | High | 9 active habits → near-zero daily completion → "I'm failing" signal daily |
| 2 | "直近30日の記録" renders empty | Medium | `value: checked ? 1 : 0` → unchecked bars height 0 = invisible |
| 3 | 9 habits is too many | High | No active/observation distinction; everything counts toward today's ring |
| 4 | Stats per-habit list duplicates /habits | Medium | `THE TABLE` section overlaps the /habits list |
| 5 | "x/3" denominator is meaningless | Medium | `category-cards.tsx` shows `done/total` where total = habits-in-category |

## Locked decisions

- **Status model:** new `status` enum column (`active` / `observing` / `archived`).
- **Observation behavior:** fully backstage — not on /today; check-in only via /habits detail; excluded from ring / overall streak / today%. Included in stats (Rhythm/Milestones).
- **Active cap:** soft (warn on promoting a 4th, allow).
- **DB changes:** executed by Claude via Supabase MCP.
- **Stats composition:** keep **Daily Rhythm + Milestones** only (remove Hero summary, By Category, THE TABLE).
- **Item 2 fix:** replace detail-page chart with the color-coded binary strip (`Last30DaysChart` style); drop `goalLine`.
- **/today BY CATEGORY:** removed (kills the /3 confusion; pointless with ≤3 active habits).
- **Dead code:** delete 6 unused components.

---

## 1. Data model (foundation)

### Migration
```sql
alter table habits
  add column status text not null default 'active'
  check (status in ('active','observing','archived'));

update habits set status = 'archived' where archived_at is not null;

create index habits_status_idx on habits (user_id, status);
```

- `status` is the single source of truth for visibility/counting.
- `archived_at` is kept as the archive timestamp (set iff `status='archived'`).
- Regenerate `lib/types/database.ts` to include `status`.

### Query changes
| Location | Before | After |
|----------|--------|-------|
| `app/(app)/today/page.tsx` | `.is("archived_at", null)` | `.eq("status","active")` |
| `app/(app)/stats/page.tsx` | `.is("archived_at", null)` | `.neq("status","archived")` |
| `app/(app)/habits/page.tsx` | filter on `archived_at` | group by `status` (active / observing / archived) |
| `app/today/actions.ts` `upsertCheckIn` (allHabits) | `.is("archived_at", null)` | `.eq("status","active")` |

### today/page.tsx check-in scoping (correctness)
`/today` fetches all check-ins in range without a habit filter. After filtering habits to `active`, the ring / overall streak / today% must use **only active habits' check-ins**. Build `checkInSet` from check-ins whose `habit_id` is in the active set (filter in the page or pass active ids into the dashboard).

---

## 2. Item 3 — Active/Observation split

### Behavior matrix
| State | /today | Check-in | Ring / streak / today% | Stats |
|-------|--------|----------|------------------------|-------|
| active | shown | /today grid | included | included |
| observing | hidden | /habits/[id] detail | excluded | included |
| archived | hidden | none | excluded | excluded |

### /habits page
- Three sections: **アクティブ**, **観察中**, **アーカイブ済み**.
- `HabitCard` gains an active↔observing toggle (in addition to edit/archive/restore).

### Observation check-in (new control on /habits/[id])
- The detail page is currently read-only. Add a check-in control so observation (and any) habits can be recorded: a "今日記録する" toggle plus quick toggles for the last ~7 days.
- Reuse `upsertCheckIn` / `deleteCheckIn`. The returned achievement is ignored here (no overlay on the detail page — observation is passive).

### Server actions (`app/habits/actions.ts`)
- `archiveHabit` → set `status='archived'` + `archived_at=now()`.
- `restoreHabit` → set `status='active'` + `archived_at=null`.
- New `setHabitStatus(id, status)` for active↔observing.
- Soft cap: when promoting to `active` or creating a new active habit, if active count is already ≥3, the UI shows a confirm dialog ("アクティブは3個までを推奨。それでも追加しますか?") — allowed on confirm.

### Achievement logic (`upsertCheckIn`)
- "Day complete" (完 hanko) and "month 80%" must count **active habits only** (not observation/archived), so observation habits never block the daily complete stamp.
- Per-habit streak milestones still fire for observation habits (they feed the Milestones stats section), but no overlay on the detail page.

### Streak semantics (unchanged, stated for clarity)
- Overall streak = consecutive days with ≥1 **active** check-in (lenient; protects momentum).
- "完" hanko = all active habits done that day (realistic with 3 active).

### Reducing 9 → 3 active (data step)
- After the migration, all existing habits are `active`.
- Claude lists current habits (via Supabase MCP), archives the confirmed duplicate "本を30分読む", and **asks the user which 3 remain active**; the rest become `observing`.

---

## 3. Item 1 — Duplicate removal
- Via Supabase MCP: list habits, set one duplicate "本を30分読む" to `status='archived'`.
- Folded into the data step above.

---

## 4. Item 2 — "直近30日の記録" empty graph
- Root cause: `buildGoalBarData` in `app/(app)/habits/[id]/page.tsx:103-114` produces `value: checked ? 1 : 0`; `GoalBarChart` uses `dataKey="value"`, so unchecked = height 0 = invisible.
- A single habit's day is binary → render a color-coded strip where **every** day has a visible bar (完了=朱, 未完了=淡色). `components/habits/detail/last30-days-chart.tsx` already does this correctly (`dataKey={() => 1}`) and is currently unused.
- **Change:** Section "02 RECENT" on the detail page uses the binary strip (Last30DaysChart shape: `{date, displayDate, checked}`); remove the `goalLine` (meaningless for binary per-habit data).
- **Not touched:** the /stats Daily Rhythm `GoalBarChart` uses real 0..N counts and is correct.

---

## 5. Item 4 — Suppress 0%/Streak-0

### HeroRing (`components/today/hero-ring.tsx`)
- When `checked === 0`:
  - Ring: muted track only, no progress arc / no primary fill.
  - Center "0/3" rendered in muted tone (not primary).
  - Focal element becomes a `最高 {bestStreak}日連続` badge in primary (achievement as the hero), when bestStreak > 0.
- When `checked ≥ 1`: ring + count return to primary (current behavior).
- `bestStreak` must be passed into `HeroRing` (currently only `checked`, `total`, `streak`).
- Streak chip already hidden at 0 — unchanged. "完" hanko unchanged.

### Streak card (`components/today/stat-cards.tsx`)
- When `streak === 0` and `bestStreak > 0`: show `最高 {bestStreak}日` as the large focal number; current `0日` becomes the small subtitle (hierarchy inverted).
- When `streak > 0`: current value is the focal number (current behavior).

---

## 6. Item 5 — Stats slim + /3 fix

### /stats (`app/(app)/stats/page.tsx` + `components/stats/stats-dashboard.tsx`)
- Keep **Daily Rhythm** + **Milestones** only.
- Remove: Hero summary, By Category, THE TABLE (and their data builders / props that become unused).
- Daily Rhythm: count active+observation check-ins per day (exclude archived); `goalLine = active habit count`.
- Page title/header retained so the page isn't bare when there are no milestones yet.

### /3 fix (/today BY CATEGORY)
- The confusing `{done}/{total}` lives in `components/today/category-cards.tsx:46` (total = habits-in-category, not `target_per_week`).
- **Remove section "04 BY CATEGORY"** from `components/today/today-dashboard.tsx` (and stop deriving `categoryStats`). With ≤3 active habits a category breakdown is noise, and this is the confusion source.

---

## 7. Dead code cleanup
Delete unused components (confirmed no live imports):
- `components/today/habit-grid.tsx`
- `components/today/today-hero-card.tsx`
- `components/today/daily-stats-row.tsx`
- `components/today/category-breakdown.tsx`
- `components/habits/detail/stats-row.tsx`
- `components/stats/stats-client.tsx`

(`components/today/category-cards.tsx` becomes unused after item 5 removal → also delete.)

---

## 8. Implementation order
0. **DB foundation** — status migration + backfill + index; archive duplicate; regen types.
1. **Item 2** — chart fix (independent quick win).
2. **Item 3 app code** — query changes + check-in scoping; /habits 3 sections + toggle + soft cap; observation check-in on detail; `upsertCheckIn` active-only; designate 3 active (ask user).
3. **Item 4** — HeroRing 0-state + Streak card flip.
4. **Item 5** — stats slim + remove /today BY CATEGORY.
5. **Cleanup + verify** — delete dead code; type check; manual browser verification of /today, /habits, /habits/[id], /stats (0-state, 3-active flow, observation check-in, chart rendering).

## 9. Out of scope
- Reworking the milestone detection algorithm.
- Offline-queue changes beyond what active/observation requires.
- Any redesign of the heatmap, monthly, or weekday charts on the detail page.

## 10. Verification
- `tsc` / build clean.
- Dev server: verify each route. Specifically confirm (a) the 30-day strip shows both done & not-done days; (b) /today shows only active habits and the 0-state is non-demoralizing; (c) observation habits are recordable from the detail page and excluded from the ring/streak; (d) /stats has no per-habit table and no /3.

## Notes / constraints
- Per `AGENTS.md`: this is a modified Next.js — read `node_modules/next/dist/docs/` before writing code; heed deprecation notices.
- Apply `react-best-practices` / `nextjs` skills during implementation (auto-suggested by repo hooks).
