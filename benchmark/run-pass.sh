#!/usr/bin/env bash
# One benchmark pass: ./benchmark/run-pass.sh <operation|mixed> <medium|high|stress>
# Starts from the clean database, runs k6 against the 2-CPU container and samples its CPU and memory.
set -euo pipefail
operation="$1"
profile="$2"
cd "$(dirname "$0")/.."
out="benchmark/out"
mkdir -p "$out"

make -s benchmark-reset
make -s benchmark-up > /dev/null
trap 'kill "${sampler:-0}" 2>/dev/null || true; make -s benchmark-down > /dev/null' EXIT
until curl -sf -X POST localhost:3000/health.check -d '{"header":{"callId":"up"}}' > /dev/null; do sleep 1; done

while true; do
	docker stats --no-stream --format '{{.CPUPerc}} {{.MemUsage}}' sorzs-benchmark >> "$out/$operation-$profile.stats"
	sleep 2
done &
sampler=$!
: > "$out/$operation-$profile.stats"

script="benchmark/k6/operation.js"
if [ "$operation" = "mixed" ]; then script="benchmark/k6/mixed.js"; fi
OPERATION="$operation" PROFILE="$profile" k6 run --quiet "$script" || true
