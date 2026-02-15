#!/bin/bash
# エージェントタスク表示機能検証スクリプト
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

echo "=== エージェントタスク表示機能検証 ==="
echo ""

# 1. Build check
echo "--- ビルド検証 ---"
npm run build --silent 2>&1 >/dev/null && check "npm run build 成功" "ok" || check "npm run build 成功" "fail"

# 2. Page component updated
echo ""
echo "--- ページ実装確認 ---"
grep -q "agentTaskCounts" app/page.tsx && check "agentTaskCounts 計算ロジック" "ok" || check "agentTaskCounts 計算ロジック" "fail"
grep -q "TrendingUp" app/page.tsx && check "TrendingUp アイコン使用" "ok" || check "TrendingUp アイコン使用" "fail"
grep -q "Award" app/page.tsx && check "Award アイコン使用" "ok" || check "Award アイコン使用" "fail"
grep -q "ArrowRight" app/page.tsx && check "ArrowRight アイコン使用" "ok" || check "ArrowRight アイコン使用" "fail"

# 3. Statistics section
echo ""
echo "--- 統計情報確認 ---"
grep -q "総エージェント数" app/page.tsx && check "総エージェント数表示" "ok" || check "総エージェント数表示" "fail"
grep -q "アクティブ" app/page.tsx && check "アクティブエージェント数表示" "ok" || check "アクティブエージェント数表示" "fail"
grep -q "平均担当タスク" app/page.tsx && check "平均担当タスク表示" "ok" || check "平均担当タスク表示" "fail"
grep -q "平均完了率" app/page.tsx && check "平均完了率表示" "ok" || check "平均完了率表示" "fail"

# 4. Top agents section
echo ""
echo "--- トップエージェント表示確認 ---"
grep -q "トップエージェント" app/page.tsx && check "トップエージェントタイトル" "ok" || check "トップエージェントタイトル" "fail"
grep -q "🥇" app/page.tsx && check "金メダル表示" "ok" || check "金メダル表示" "fail"
grep -q "🥈" app/page.tsx && check "銀メダル表示" "ok" || check "銀メダル表示" "fail"
grep -q "🥉" app/page.tsx && check "銅メダル表示" "ok" || check "銅メダル表示" "fail"

# 5. Link to agents page
echo ""
echo "--- エージェント一覧リンク確認 ---"
grep -q 'href="/agents"' app/page.tsx && check "エージェント一覧リンク" "ok" || check "エージェント一覧リンク" "fail"
grep -q "エージェント一覧へ" app/page.tsx && check "リンクテキスト" "ok" || check "リンクテキスト" "fail"

# 6. Agent data structure
echo ""
echo "--- エージェントデータ構造確認 ---"
grep -q "completionRate" app/page.tsx && check "completionRate 計算" "ok" || check "completionRate 計算" "fail"
grep -q "lastActivity" app/page.tsx && check "lastActivity 計算" "ok" || check "lastActivity 計算" "fail"
grep -q "topAgents" app/page.tsx && check "topAgents ソートロジック" "ok" || check "topAgents ソートロジック" "fail"

# 7. Format date function
echo ""
echo "--- フォーマット関数確認 ---"
grep -q "formatDate" app/page.tsx && check "formatDate 関数" "ok" || check "formatDate 関数" "fail"

# 8. UI consistency
echo ""
echo "--- UI 一貫性確認 ---"
grep -q "text-green-600" app/page.tsx && check "完了率色（緑）" "ok" || check "完了率色（緑）" "fail"
grep -q "text-blue-600" app/page.tsx && check "平均完了率色（青）" "ok" || check "平均完了率色（青）" "fail"
grep -q "text-zinc-900" app/page.tsx && check "基本テキスト色" "ok" || check "基本テキスト色" "fail"

# 9. No placeholder content
echo ""
echo "--- プレースホルダー残存チェック ---"
! grep -q "TODO\|PLACEHOLDER\|FIXME" app/page.tsx && check "プレースホルダーなし" "ok" || check "プレースホルダーなし" "fail"

# 10. Layout grid
echo ""
echo "--- レイアウト確認 ---"
grep -q "grid-cols-2 sm:grid-cols-4" app/page.tsx && check "統計グリッドレイアウト" "ok" || check "統計グリッドレイアウト" "fail"

echo ""
echo "=== 結果: $PASS 成功 / $FAIL 失敗 ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "🎉 全検証パス！"
