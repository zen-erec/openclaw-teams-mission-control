#!/bin/bash
# Mission Control 機能追加検証スクリプト
set -e

cd "$(dirname "$0")/.."
PASS=0
FAIL=0

check() {
  local desc="$1"
  local result="$2"
  if [ "$result" = "ok" ]; then
    echo "✅ $desc"
    PASS=$((PASS + 1))
  else
    echo "❌ $desc"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Mission Control 機能追加検証 ==="
echo ""

# 1. Build check
echo "--- ビルド検証 ---"
npm run build --silent 2>&1 >/dev/null && check "npm run build 成功" "ok" || check "npm run build 成功" "fail"

# 2. New pages exist
echo ""
echo "--- 新規ページ存在確認 ---"
for page in cron chat system content knowledge code; do
  [ -f "app/$page/page.tsx" ] && check "app/$page/page.tsx 存在" "ok" || check "app/$page/page.tsx 存在" "fail"
done

# 3. API routes exist
echo ""
echo "--- API Route 存在確認 ---"
for route in cron-health system-health knowledge code-pipeline; do
  [ -f "app/api/$route/route.ts" ] && check "app/api/$route/route.ts 存在" "ok" || check "app/api/$route/route.ts 存在" "fail"
done

# 4. Convex contentDrafts
echo ""
echo "--- Convex Schema 確認 ---"
grep -q "contentDrafts" convex/schema.ts && check "contentDrafts テーブル定義" "ok" || check "contentDrafts テーブル定義" "fail"
[ -f "convex/contentDrafts.ts" ] && check "contentDrafts 関数ファイル" "ok" || check "contentDrafts 関数ファイル" "fail"

# 5. Sidebar updated
echo ""
echo "--- サイドバー更新確認 ---"
grep -q "Cronジョブ" components/SidebarNav.tsx && check "Cron ナビ追加" "ok" || check "Cron ナビ追加" "fail"
grep -q "チャット" components/SidebarNav.tsx && check "チャット ナビ追加" "ok" || check "チャット ナビ追加" "fail"
grep -q "システム" components/SidebarNav.tsx && check "システム ナビ追加" "ok" || check "システム ナビ追加" "fail"
grep -q "コンテンツ" components/SidebarNav.tsx && check "コンテンツ ナビ追加" "ok" || check "コンテンツ ナビ追加" "fail"
grep -q "ナレッジ" components/SidebarNav.tsx && check "ナレッジ ナビ追加" "ok" || check "ナレッジ ナビ追加" "fail"
grep -q "コード" components/SidebarNav.tsx && check "コード ナビ追加" "ok" || check "コード ナビ追加" "fail"

# 6. Japanese UI check
echo ""
echo "--- 日本語UI確認 ---"
grep -q "Cronジョブ監視" app/cron/page.tsx && check "Cron 日本語タイトル" "ok" || check "Cron 日本語タイトル" "fail"
grep -q "システムヘルス" app/system/page.tsx && check "System 日本語タイトル" "ok" || check "System 日本語タイトル" "fail"
grep -q "コンテンツパイプライン" app/content/page.tsx && check "Content 日本語タイトル" "ok" || check "Content 日本語タイトル" "fail"
grep -q "ナレッジ検索" app/knowledge/page.tsx && check "Knowledge 日本語タイトル" "ok" || check "Knowledge 日本語タイトル" "fail"
grep -q "コードパイプライン" app/code/page.tsx && check "Code 日本語タイトル" "ok" || check "Code 日本語タイトル" "fail"

# 7. Existing pages not broken
echo ""
echo "--- 既存ページ保全確認 ---"
[ -f "app/page.tsx" ] && grep -q "タスクボード" app/page.tsx && check "ダッシュボード健在" "ok" || check "ダッシュボード健在" "fail"
[ -f "app/calendar/page.tsx" ] && check "カレンダーページ健在" "ok" || check "カレンダーページ健在" "fail"
[ -f "app/agents/page.tsx" ] && check "エージェントページ健在" "ok" || check "エージェントページ健在" "fail"
[ -f "app/activity/page.tsx" ] && check "アクティビティページ健在" "ok" || check "アクティビティページ健在" "fail"

# 8. No placeholder content
echo ""
echo "--- プレースホルダー残存チェック ---"
! grep -rq "TODO\|PLACEHOLDER\|FIXME" app/cron/page.tsx app/chat/page.tsx app/system/page.tsx app/content/page.tsx app/knowledge/page.tsx app/code/page.tsx 2>/dev/null && check "プレースホルダーなし" "ok" || check "プレースホルダーなし" "fail"

echo ""
echo "=== 結果: $PASS 成功 / $FAIL 失敗 ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "🎉 全検証パス！"
