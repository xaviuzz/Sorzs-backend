# Mixed scenario

Date 2026-11-24, backend commit c8216f2 plus the uncommitted benchmark code, profile high. Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.

| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms |
|---|---|---|---|---|---|---|
| health.check | 364 | 1.7 | 4868.2 | 27001.5 | 36597.7 | 38390.5 |
| auth.login | 109 | 0.5 | 10317.6 | 42328.8 | 48279.1 | 48841.5 |
| sorzs.add | 1176 | 5.5 | 11314.4 | 38419.6 | 44303.2 | 49736.8 |
| sorzs.inspect | 627 | 3.0 | 11261.8 | 39918.8 | 44121.6 | 57637.5 |
| sorzs.list | 2989 | 14.1 | 5184.9 | 27823.5 | 38165.7 | 41233.2 |
| sorzs.search | 5921 | 27.9 | 11142.7 | 38871.8 | 46024.7 | 60001.1 |
| sorzs.census | 20 | 0.1 | 11522.7 | 28729.8 | 37208.4 | 39328.1 |
| users.list | 452 | 2.1 | 4632.4 | 25301.0 | 38171.9 | 39212.5 |
| users.add | 123 | 0.6 | 4805.4 | 30518.4 | 37762.6 | 38162.0 |
| users.setRole | 129 | 0.6 | 6336.5 | 24315.6 | 35363.2 | 36691.4 |

4 of 11910 replies were not ok. Container CPU avg 100 % and max 188 % of 200 %, memory max 253 MiB.
