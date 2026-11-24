# Mixed scenario

Date 2026-11-24, backend commit ae9e033 plus the uncommitted benchmark code, profile stress. Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.

| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms |
|---|---|---|---|---|---|---|
| health.check | 48 | 4.4 | 109.8 | 562.0 | 1528.8 | 2087.0 |
| auth.login | 17 | 1.5 | 658.0 | 2668.5 | 2681.8 | 2685.1 |
| sorzs.add | 160 | 14.6 | 411.8 | 2040.0 | 2636.0 | 2650.5 |
| sorzs.inspect | 87 | 7.9 | 374.3 | 1680.0 | 2008.8 | 2022.2 |
| sorzs.list | 415 | 37.8 | 121.8 | 840.3 | 1700.1 | 2083.1 |
| sorzs.search | 834 | 76.0 | 573.0 | 2004.7 | 2634.8 | 2680.2 |
| sorzs.census | 4 | 0.4 | 515.4 | 902.6 | 927.7 | 934.0 |
| users.list | 75 | 6.8 | 115.7 | 666.7 | 1029.0 | 1371.9 |
| users.add | 13 | 1.2 | 465.1 | 1522.8 | 1831.3 | 1908.4 |
| users.setRole | 21 | 1.9 | 72.9 | 1228.2 | 1633.1 | 1734.3 |

0 of 1674 replies were not ok. Container CPU avg 97 % and max 126 % of 200 %, memory max 199 MiB.
