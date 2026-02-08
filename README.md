# Mission Control

タスク管理用マルチエージェントシステム ダッシュボード

## Setup

### 1. 依存関係のインストール

```bash
cd mission-control
npm install
```

### 2. Convexプロジェクトの作成

```bash
npx convex dev
```

初回実行時にプロジェクト作成を求められます。

### 3. エージェントの登録

```bash
npx convex run agents:seedAgents
```

### 4. 環境変数の設定

`.env.local` を作成:

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 5. 開発サーバーの起動

```bash
# ConvexとNext.jsを同時起動
npm run convex:dev &
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 機能一覧

### 📊 ダッシュボード

- **統計カード**: 全タスク数、完了率、アクティブエージェント数を表示
- **リアルタイム更新**: Convexのリアクティブクエリによる即時反映
- **タスク詳細パネル**: 選択タスクのメッセージログとアクティビティログを表示
- **URL同期**: 選択中のタスク・エージェントがURLで共有可能

### 📋 カンバンボード

- **ドラッグ&ドロップ**: カラム間でタスクを移動
- **リアルタイム更新**: Convexリアクティブクエリ
- **タスク作成**: Inboxに新規タスク追加
- **フィルタリング**: ステータス、割り当てエージェント、タグによるフィルタ
- **ステータス管理**: inbox → assigned → in_progress → review → done

### 👥 エージェント一覧

- **エージェントカード**: 各エージェントのステータスと担当タスクを表示
- **タスク割り当て**: エージェントからタスクへスムーズに移動
- **URL同期**: 選択中のエージェントがURLで共有可能

### 📄 サイドバー

- **レスポンシブデザイン**: モバイルは水平ナビ、デスクトップは垂直サイドバー
- **ルートハイライト**: 現在のページを視覚的に強調

### 📝 アクティビティフィード

- **リアルタイム更新**: 全てのタスク・エージェントのアクティビティを時系列で表示
- **リンク付き**: 各アクティビティからタスク・エージェントへ遷移可能

## CLI Operations

```bash
# タスクリスト取得
npx convex run tasks:list

# ステータス別タスク取得
npx convex run tasks:listByStatus '{"status": "inbox"}'

# タスク作成
npx convex run tasks:create '{"title": "New task", "description": "Details"}'

# メッセージ送信
npx convex run messages:create '{"taskId": "xxx", "content": "@loki Please review"}'

# 通知確認
npx convex run notifications:getUnread '{"agentId": "xxx"}'
```

### Notification Daemon

```bash
# 直接実行
npm run daemon:notify

# pm2で実行
pm2 start scripts/notification-daemon.ts --name notify-daemon --interpreter ts-node
```

## Schema

### テーブル

| テーブル名 | 説明 |
|----------|------|
| agents | エージェント情報 |
| tasks | タスク |
| messages | タスクコメント |
| activities | アクティビティフィード |
| documents | ドキュメント・納品物 |
| notifications | @メンション通知 |
| subscriptions | タスク購読 |

### タスクステータスフロー

```
inbox → assigned → in_progress → review → done
                         ↓
                      blocked
```

## プロジェクト構造

```
mission-control/
├── app/
│   ├── globals.css
│   ├── layout.tsx          # レイアウト（サイドバー含む）
│   ├── page.tsx            # ダッシュボード + カンバンボード
│   ├── agents/
│   │   └── page.tsx        # エージェント一覧ページ
│   └── activity/
│       └── page.tsx        # アクティビティフィードページ
├── components/
│   ├── agents/
│   │   └── AgentCard.tsx   # エージェントカード
│   ├── board/
│   │   ├── KanbanBoard.tsx # カンバンボード
│   │   ├── Column.tsx      # カラム
│   │   ├── TaskCard.tsx    # タスクカード
│   │   ├── TaskDetailPanel.tsx  # タスク詳細パネル
│   │   └── CreateTaskModal.tsx   # タスク作成モーダル
│   ├── activity/
│   │   └── ActivityFeed.tsx     # アクティビティフィード
│   └── SidebarNav.tsx      # サイドバーナビゲーション
├── convex/
│   ├── schema.ts
│   ├── tasks.ts
│   ├── messages.ts
│   ├── notifications.ts
│   ├── activities.ts
│   └── agents.ts
├── lib/
│   └── utils.ts
├── scripts/
│   └── notification-daemon.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## アーキテクチャ

```
┌─────────────────────────────────────┐
│         Mission Control UI          │
│  Dashboard + Kanban + Agents + Feed  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│           Convex DB                 │
│  ┌─────┬────────┬──────────────┐   │
│  │tasks│messages│notifications │   │
│  │     │        │activities    │   │
│  │     │        │agents        │   │
│  └─────┴────────┴──────────────┘   │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│     Notification Daemon             │
│   (Poll → OpenClaw sessions)        │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│        OpenClaw Gateway             │
│   (10 Agent Sessions)               │
└─────────────────────────────────────┘
```

## 履歴

### 2026-02-09 - TASK-008D / TASK-008E 完了
- ✅ ダッシュボード統計カード追加（Total Tasks, Completion Rate, Active Agents）
- ✅ TaskDetailPanel実装（メッセージログ + アクティビティログ）
- ✅ URL同期（選択タスク・エージェントのハイライト）
- ✅ ActivityFeed改善（エージェント/タスクへのリンク）

### 2026-02-09 - TASK-008B / TASK-008C 完成
- ✅ カンバンボードのフィルタリング機能追加
- ✅ エージェント一覧画面追加

### 2026-02-08 - TASK-008A 完成
- ✅ SidebarNav追加（レスポンシブデザイン）
