# Mixed scenario

Date 2026-11-24, backend commit f70771b plus the uncommitted benchmark code, profile high. Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.

| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms |
|---|---|---|---|---|---|---|
| health.check | 1901 | 9.0 | 1088.8 | 3163.4 | 3898.2 | 4583.8 |
| auth.login | 596 | 2.8 | 3086.4 | 5840.4 | 7985.7 | 8807.7 |
| sorzs.add | 6589 | 31.3 | 2465.3 | 5566.6 | 6757.3 | 8640.7 |
| sorzs.inspect | 3356 | 16.0 | 2455.7 | 5333.3 | 6560.3 | 8377.4 |
| sorzs.list | 16633 | 79.1 | 1105.7 | 3191.5 | 3916.3 | 5725.2 |
| sorzs.search | 32759 | 155.8 | 2427.8 | 5496.6 | 6648.8 | 8856.9 |
| sorzs.census | 134 | 0.6 | 1408.8 | 3569.2 | 3942.6 | 3952.4 |
| users.list | 2486 | 11.8 | 1113.4 | 3192.8 | 3875.0 | 5721.4 |
| users.add | 643 | 3.1 | 3054.5 | 6181.3 | 7474.3 | 9411.4 |
| users.setRole | 669 | 3.2 | 1125.6 | 3208.5 | 3928.0 | 4590.6 |

0 of 65766 replies were not ok. Container CPU avg 144 % and max 205 % of 200 %, memory max 284 MiB.
