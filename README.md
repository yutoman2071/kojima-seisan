# こじま 生産管理システム

Next.js + Neon (PostgreSQL) + Drizzle ORM で構築した生産管理Webアプリです。

## 画面構成

| 画面 | URL | 概要 |
|------|-----|------|
| ダッシュボード | `/` | 今月のKPI・直近7日間の実績グラフ |
| 生産計画入力 | `/plans` | 日別の生産計画を登録・編集・削除 |
| 実績記録 | `/results` | 日別の生産実績を登録・編集・削除 |
| 計画実績比較 | `/report` | 計画と実績の差異・達成率レポート |
| マスタ管理 | `/master` | 製品・工程・作業者のマスタ管理 |

## セットアップ手順

### 1. 環境変数の設定

`.env.local` に Neon の接続文字列を設定してください：

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

### 2. DBテーブルの作成

```bash
npm run db:push
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。