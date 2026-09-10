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

git add public/data/speetto.json
if git diff --staged --quiet; then
  log "변경 없음"
  exit 0
fi
git commit -q -m "data: update speetto (로컬 자동 스크래핑)"
for i in 1 2 3; do
  if git push -q origin HEAD:main; then
    log "푸시 완료 ($(git rev-parse --short HEAD))"
    exit 0
  fi
  git pull -q --rebase origin main
done
log "푸시 실패"
exit 1
