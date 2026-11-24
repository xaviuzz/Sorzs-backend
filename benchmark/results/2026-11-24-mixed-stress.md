# Mixed scenario

Date 2026-11-24, backend commit c8216f2 plus the uncommitted benchmark code, profile stress. Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.

| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms |
|---|---|---|---|---|---|---|
| health.check | 20 | 2.6 | 156.2 | 850.4 | 850.6 | 850.6 |
| auth.login | 3 | 0.4 | 727.4 | 970.1 | 991.7 | 997.1 |
| sorzs.add | 76 | 9.8 | 462.3 | 1267.1 | 1434.5 | 1436.4 |
| sorzs.inspect | 36 | 4.6 | 607.2 | 1289.7 | 1370.8 | 1387.8 |
| sorzs.list | 210 | 27.1 | 170.4 | 875.1 | 1032.7 | 1152.0 |
| sorzs.search | 359 | 46.3 | 551.8 | 1303.1 | 1510.8 | 1690.4 |
| sorzs.census | 0 | | | | | |
| users.list | 27 | 3.5 | 205.2 | 858.7 | 1080.8 | 1158.4 |
| users.add | 7 | 0.9 | 440.9 | 708.2 | 714.6 | 716.2 |
| users.setRole | 4 | 0.5 | 155.9 | 358.0 | 386.1 | 393.2 |

0 of 742 replies were not ok. Container CPU avg 92 % and max 118 % of 200 %, memory max 107 MiB.
