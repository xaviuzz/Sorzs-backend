# Mixed scenario

Date 2026-11-24, backend commit f70771b plus the uncommitted benchmark code, profile stress. Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.

| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms |
|---|---|---|---|---|---|---|
| health.check | 113 | 8.4 | 134.2 | 680.7 | 996.4 | 1047.4 |
| auth.login | 26 | 1.9 | 787.7 | 1454.7 | 1829.6 | 1944.4 |
| sorzs.add | 316 | 23.4 | 420.7 | 1174.6 | 1411.2 | 1466.6 |
| sorzs.inspect | 186 | 13.8 | 416.3 | 1197.1 | 1440.0 | 1477.1 |
| sorzs.list | 908 | 67.2 | 133.1 | 695.6 | 1050.4 | 1137.9 |
| sorzs.search | 1723 | 127.5 | 414.2 | 1302.2 | 1427.8 | 1575.1 |
| sorzs.census | 10 | 0.7 | 340.8 | 953.0 | 1083.8 | 1116.5 |
| users.list | 159 | 11.8 | 155.9 | 401.4 | 1015.9 | 1049.4 |
| users.add | 27 | 2.0 | 679.4 | 1802.0 | 1859.8 | 1873.1 |
| users.setRole | 43 | 3.2 | 100.0 | 405.9 | 721.2 | 731.3 |

0 of 3511 replies were not ok. Container CPU avg 101 % and max 199 % of 200 %, memory max 217 MiB.
