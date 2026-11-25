# Mixed scenario

Date 2026-11-24, backend commit f70771b plus the uncommitted benchmark code, profile medium. Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.

| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms |
|---|---|---|---|---|---|---|
| health.check | 178 | 1.5 | 0.8 | 20.6 | 127.5 | 151.8 |
| auth.login | 60 | 0.5 | 229.5 | 386.1 | 436.4 | 451.7 |
| sorzs.add | 569 | 4.7 | 121.0 | 147.7 | 257.3 | 344.0 |
| sorzs.inspect | 246 | 2.0 | 101.4 | 125.0 | 190.2 | 273.8 |
| sorzs.list | 1447 | 11.9 | 1.9 | 20.8 | 116.9 | 248.5 |
| sorzs.search | 2712 | 22.4 | 102.6 | 133.0 | 212.9 | 357.1 |
| sorzs.census | 13 | 0.1 | 148.1 | 212.6 | 216.5 | 217.5 |
| users.list | 225 | 1.9 | 8.9 | 36.4 | 116.7 | 158.1 |
| users.add | 61 | 0.5 | 270.7 | 415.7 | 505.9 | 603.3 |
| users.setRole | 62 | 0.5 | 8.2 | 21.6 | 41.4 | 52.5 |

0 of 5573 replies were not ok. Container CPU avg 43 % and max 100 % of 200 %, memory max 171 MiB.
