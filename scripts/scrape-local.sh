#!/bin/zsh
# 스피또 잔여 현황·당첨 판매점을 로컬(맥)에서 긁어 GitHub에 푸시한다.
# GitHub Actions 러너(해외 IP)에서는 동행복권 판매점 API가 차단되어 로컬 실행이 필요하다.
# launchd(kr.satto.scrape)가 하루 3번 호출한다. 작업 트리를 건드리지 않도록 별도 클론(~/.satto-scrape)을 쓴다.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

REPO_URL="https://github.com/pmsmbc/saju-lotto-speetto.git"
WORK="${SATTO_SCRAPE_DIR:-$HOME/.satto-scrape}"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

if [ ! -d "$WORK/.git" ]; then
  log "클론 생성: $WORK"
  git clone --quiet "$REPO_URL" "$WORK"
fi
cd "$WORK"
git fetch -q origin main
git reset -q --hard origin/main

node scripts/scrape-speetto.js

# 로또 1등 배출점은 주 1회만. 전 회차(1200여 개)를 훑기 때문에 매번 돌리지 않는다.
# 추첨은 토요일이므로 일요일에 한 번 갱신한다(놓치면 다음 실행에서 만회).
STORES_JSON="public/data/lotto-stores.json"
if [ ! -f "$STORES_JSON" ]; then
  log "배출점 데이터 없음 — 최초 수집"
  node scripts/scrape-lotto-stores.js || log "배출점 수집 실패(기존 데이터 유지)"
elif [ "$(date '+%u')" = "7" ] && [ "$(date -r "$STORES_JSON" '+%Y-%m-%d')" != "$(date '+%Y-%m-%d')" ]; then
  log "일요일 — 배출점 주간 갱신"
  node scripts/scrape-lotto-stores.js || log "배출점 수집 실패(기존 데이터 유지)"
fi

git add public/data/speetto.json public/data/lotto-stores.json
if git diff --staged --quiet; then
  log "변경 없음"
  exit 0
fi
git commit -q -m "data: update speetto·로또 배출점 (로컬 자동 스크래핑)"
for i in 1 2 3; do
  if git push -q origin HEAD:main; then
    log "푸시 완료 ($(git rev-parse --short HEAD))"
    exit 0
  fi
  git pull -q --rebase origin main
done
log "푸시 실패"
exit 1
