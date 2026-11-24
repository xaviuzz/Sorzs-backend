#!/usr/bin/env bash
# Every operation alone at one profile: ./benchmark/run-isolated.sh <medium|high|stress>
set -euo pipefail
cd "$(dirname "$0")/.."
for operation in health.check auth.login sorzs.add sorzs.inspect sorzs.list sorzs.search sorzs.census users.list users.add users.setRole; do
	echo "pass: $operation $1"
	./benchmark/run-pass.sh "$operation" "$1"
done
