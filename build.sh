#!/usr/bin/env bash
# 소스 순서·모듈 경계는 src/modules.json에서 관리한다.
set -euo pipefail
cd "$(dirname "$0")"
exec node tools/build.cjs "$@"
