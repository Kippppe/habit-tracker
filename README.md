# 習慣トラッカー

日々の習慣を記録・可視化する PWA アプリ。週次グリッドでチェックイン、ストリーク追跡、年間ヒートマップ、統計ダッシュボードを備え、オフライン時も IndexedDB キューで操作を保持します。

## 技術スタック

| カテゴリ | 採用技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router, TypeScript strict) |
| スタイリング | Tailwind CSS v4 + shadcn/ui |
| バックエンド | Supabase (Postgres + Auth + RLS) |
| データフェッチ | TanStack Query v5 |
| グラフ | Recharts v3 |
| アニメーション | Framer Motion v12 |
| ユーティリティ | date-fns v4 + date-fns-tz v3 |
| テスト | Vitest v4 |
| PWA | Custom Service Worker + idb (IndexedDB) |
| テーマ | next-themes (system / light / dark) |

## ローカル開発

### 1. リポジトリをクローン

```bash
git clone https://github.com/kippppe/habit-tracker.git
cd habit-tracker
npm install
```

### 2. Supabase プロジェクトを用意

[supabase.com](https://supabase.com) で新規プロジェクトを作成し、後述の DDL を適用します。

### 3. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を開き、Supabase の値を入力します:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<your-key>
```

> **注意**: Supabase Dashboard の **Project Settings → API** から取得できます。  
> キーは `anon/public` キー（publishable key）を使用してください。

### 4. 開発サーバー起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリが起動します。

---

## Supabase セットアップ

### DDL（スキーマ適用）

Supabase Dashboard の **SQL Editor** で以下を実行します:

```sql
-- 習慣テーブル
create table public.habits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users not null,
  name             text not null,
  category         text,
  target_per_week  int not null default 7,
  difficulty_level int not null default 1,
  color            text,
  created_at       timestamptz not null default now(),
  archived_at      timestamptz
);

-- チェックインテーブル
create table public.check_ins (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid references public.habits(id) on delete cascade not null,
  user_id    uuid references auth.users not null,
  date       date not null,
  note       text,
  created_at timestamptz not null default now(),
  unique(habit_id, date)
);

-- RLS 有効化
alter table public.habits   enable row level security;
alter table public.check_ins enable row level security;

-- habits ポリシー（自分のレコードのみ）
create policy "habits: own rows" on public.habits
  for all using (auth.uid() = user_id);

-- check_ins ポリシー（自分のレコードのみ）
create policy "check_ins: own rows" on public.check_ins
  for all using (auth.uid() = user_id);
```

### 認証設定（Magic Link）

1. Supabase Dashboard → **Authentication → Providers**
2. **Email** プロバイダを有効化
3. **Confirm email** を OFF（Magic Link のみ使用）
4. **OTP Expiry** を任意で調整（デフォルト: 1時間）

---

## Vercel デプロイ

### 1. GitHub にプッシュ

```bash
git push origin main
```

### 2. Vercel でプロジェクトをインポート

[vercel.com/new](https://vercel.com/new) → GitHub リポジトリを選択 → **Import**

フレームワークは自動検出（Next.js）されます。

### 3. 環境変数を設定

Vercel の **Settings → Environment Variables** に以下を追加:

| 変数名 | 値 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |

### 4. Supabase に Vercel ドメインを登録

初回デプロイ後、Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://<your-app>.vercel.app`
- **Redirect URLs** に追加: `https://<your-app>.vercel.app/auth/callback`

> プレビューデプロイも使う場合は `https://*-<your-project>.vercel.app/auth/callback` をワイルドカードで追加できます。

### 5. 再デプロイ（必要な場合）

URL 設定後、Vercel ダッシュボードから **Redeploy** を実行します。

---

## 動作確認チェックリスト

- [ ] Magic Link ログイン → セッション維持
- [ ] 習慣の追加・編集・アーカイブ
- [ ] /today グリッドでチェックイン（楽観更新）
- [ ] /habits/[id] ヒートマップ・グラフ表示
- [ ] /stats ソート・集計表示
- [ ] ダークモード切替（system / light / dark）
- [ ] PWA インストール（Chrome: アドレスバーのインストールアイコン）
- [ ] iOS Safari ホーム画面追加 → スタンドアロン起動
- [ ] オフライン状態でチェックイン → 再接続後に同期

## テスト

```bash
npm test          # Vitest でストリーク計算の単体テスト
npm run test:watch
```

## ライセンス

MIT
