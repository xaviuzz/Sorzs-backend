# Mixed scenario

Date 2026-11-24, backend commit ae9e033 plus the uncommitted benchmark code, profile high. Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.

| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms |
|---|---|---|---|---|---|---|
| health.check | 1498 | 7.1 | 1386.7 | 4395.1 | 4830.6 | 7244.8 |
| auth.login | 495 | 2.4 | 3662.1 | 7416.8 | 8248.9 | 9325.9 |
| sorzs.add | 4857 | 23.1 | 3274.2 | 7093.2 | 8622.6 | 11730.7 |
| sorzs.inspect | 2454 | 11.7 | 3267.9 | 7085.3 | 8567.7 | 11397.7 |
| sorzs.list | 12274 | 58.4 | 1460.0 | 4406.1 | 4968.4 | 8265.4 |
| sorzs.search | 24675 | 117.4 | 3246.9 | 7074.5 | 8564.3 | 11975.8 |
| sorzs.census | 102 | 0.5 | 2226.4 | 4592.1 | 4882.0 | 5004.4 |
| users.list | 1895 | 9.0 | 1400.5 | 4383.2 | 4935.5 | 7247.6 |
| users.add | 478 | 2.3 | 1702.9 | 4604.8 | 5019.4 | 8573.6 |
| users.setRole | 532 | 2.5 | 1479.9 | 4367.9 | 4962.3 | 7682.6 |

0 of 49260 replies were not ok. Container CPU avg 108 % and max 200 % of 200 %, memory max 324 MiB.
