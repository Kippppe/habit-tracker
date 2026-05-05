import { openDB } from "idb";

const DB_NAME = "habit-offline";
const STORE = "check-in-queue";
const DB_VERSION = 1;

interface QueueItem {
  key: string; // `${habitId}:${date}`
  habitId: string;
  date: string;
  action: "upsert" | "delete";
  retries: number;
  enqueuedAt: number;
}

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    },
  });
}

/** オフライン時のチェックインをキューに追加（habit_id + date で dedup）*/
export async function enqueueCheckIn(
  habitId: string,
  date: string,
  action: "upsert" | "delete"
): Promise<void> {
  const db = await getDB();
  const key = `${habitId}:${date}`;
  await db.put(STORE, { key, habitId, date, action, retries: 0, enqueuedAt: Date.now() });
}

/** キューを全件取得 */
async function getAllQueued(): Promise<QueueItem[]> {
  const db = await getDB();
  return db.getAll(STORE);
}

/** 処理済みアイテムを削除 */
async function removeItem(key: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, key);
}

/** リトライカウントを更新 */
async function incrementRetry(item: QueueItem): Promise<void> {
  const db = await getDB();
  await db.put(STORE, { ...item, retries: item.retries + 1 });
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/** 指数バックオフで単一アイテムを送信 */
async function sendItem(item: QueueItem): Promise<boolean> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, BASE_DELAY_MS * 2 ** (attempt - 1)));
    }
    try {
      const url = "/api/check-ins/sync";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId: item.habitId, date: item.date, action: item.action }),
      });
      if (res.ok) return true;
    } catch {
      // network error — retry
    }
  }
  return false;
}

/** オンライン復帰時にキューを flush */
export async function flushQueue(): Promise<void> {
  if (!navigator.onLine) return;
  const items = await getAllQueued();
  if (items.length === 0) return;

  await Promise.allSettled(
    items.map(async (item) => {
      if (item.retries >= MAX_RETRIES) {
        await removeItem(item.key);
        return;
      }
      const ok = await sendItem(item);
      if (ok) {
        await removeItem(item.key);
      } else {
        await incrementRetry(item);
      }
    })
  );
}

/** キューサイズを返す（UI バッジ表示用） */
export async function getQueueSize(): Promise<number> {
  const db = await getDB();
  return db.count(STORE);
}
