#!/bin/bash
# MC Dashboard RPGエージェントステータスページ検証スクリプト

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

# テスト関数
test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS_COUNT++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL_COUNT++))
}

echo "=== MC Dashboard RPGエージェントステータスページ検証 ==="
echo ""

cd "$(dirname "$0")/.."

# 1. ページファイルが存在するか
if [ -f "app/agents/page.tsx" ]; then
    test_pass "app/agents/page.tsx が存在する"
else
    test_fail "app/agents/page.tsx が存在しない"
fi

# 2. コンポーネントが存在するか
if [ -f "components/agents/AgentCard.tsx" ]; then
    test_pass "components/agents/AgentCard.tsx が存在する"
else
    test_fail "components/agents/AgentCard.tsx が存在しない"
fi

# 3. 13エージェントのデータが定義されているか
if grep "AGENT_ROSTER" "app/agents/page.tsx" > /dev/null 2>&1; then
    AGENT_COUNT=$(grep "name: \"" "app/agents/page.tsx" | wc -l | tr -d ' ')
    if [ "$AGENT_COUNT" -eq 13 ]; then
        test_pass "13エージェントのデータが定義されている（Zen, Jarvis, Shuri, Fury, Vision, Loki, Quill, Wanda, Pepper, Friday, Rocket, Banner, Wong）"
    else
        test_fail "エージェント数が正しくない（期待: 13, 実際: $AGENT_COUNT）"
    fi
else
    test_fail "AGENT_ROSTER が定義されていない"
fi

# 4. 全エージェントが定義されているか
REQUIRED_AGENTS=("Zen" "Jarvis" "Shuri" "Fury" "Vision" "Loki" "Quill" "Wanda" "Pepper" "Friday" "Rocket" "Banner" "Wong")
ALL_AGENTS_FOUND=true
for agent in "${REQUIRED_AGENTS[@]}"; do
    if ! grep "name: \"$agent\"" "app/agents/page.tsx" > /dev/null 2>&1; then
        test_fail "エージェント $agent が定義されていない"
        ALL_AGENTS_FOUND=false
    fi
done
if $ALL_AGENTS_FOUND; then
    test_pass "全13エージェントが定義されている"
fi

# 5. D&Dクラスが定義されているか
DND_CLASSES=("Paladin" "Artificer" "Wizard" "Rogue" "Cleric" "Bard" "Ranger" "Sorcerer" "Druid" "Warlock" "Fighter" "Barbarian" "Monk")
ALL_CLASSES_FOUND=true
for class in "${DND_CLASSES[@]}"; do
    if ! grep "agentClass: \"$class\"" "app/agents/page.tsx" > /dev/null 2>&1; then
        test_fail "クラス $class が定義されていない"
        ALL_CLASSES_FOUND=false
    fi
done
if $ALL_CLASSES_FOUND; then
    test_pass "全13種類のD&Dクラスが定義されている"
fi

# 6. RPG要素が含まれているか
RPG_ELEMENTS=("level:" "hp:" "abilities:")
ALL_RPG_FOUND=true
for element in "${RPG_ELEMENTS[@]}"; do
    if ! grep "$element" "app/agents/page.tsx" > /dev/null 2>&1; then
        test_fail "RPG要素 $element が定義されていない"
        ALL_RPG_FOUND=false
    fi
done
if $ALL_RPG_FOUND; then
    test_pass "全RPG要素（level, hp, abilities）が定義されている"
fi

# 7. ビルドが成功するか
echo ""
echo "ビルド検証中..."
if npm run build > /dev/null 2>&1; then
    test_pass "npm run build が成功する"
else
    test_fail "npm run build が失敗する"
fi

# 8. ルートが生成されているか
if [ -d ".next/server/app/agents" ]; then
    test_pass "/agents ルートが生成されている"
else
    test_fail "/agents ルートが生成されていない"
fi

# 9. AgentCardコンポーネントがエクスポートされているか
if grep "export.*function AgentCard" "components/agents/AgentCard.tsx" > /dev/null 2>&1; then
    test_pass "AgentCard コンポーネントがエクスポートされている"
else
    test_fail "AgentCard コンポーネントがエクスポートされていない"
fi

# 10. RpgAgentProfile型が定義されているか
if grep "export interface RpgAgentProfile" "components/agents/AgentCard.tsx" > /dev/null 2>&1; then
    test_pass "RpgAgentProfile 型が定義されている"
else
    test_fail "RpgAgentProfile 型が定義されていない"
fi

echo ""
echo "=== 検証結果 ==="
echo -e "${GREEN}PASS: $PASS_COUNT${NC}"
echo -e "${RED}FAIL: $FAIL_COUNT${NC}"

if [ $FAIL_COUNT -eq 0 ]; then
    echo ""
    echo "すべての検証に合格しました！"
    exit 0
else
    echo ""
    echo "一部の検証に失敗しました"
    exit 1
fi
