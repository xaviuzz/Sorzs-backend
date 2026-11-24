# Mixed scenario

Date 2026-11-24, backend commit ae9e033 plus the uncommitted benchmark code, profile medium. Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.

| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms |
|---|---|---|---|---|---|---|
| health.check | 159 | 1.3 | 1.9 | 201.3 | 262.7 | 371.9 |
| auth.login | 55 | 0.5 | 232.2 | 418.2 | 563.9 | 580.3 |
| sorzs.add | 522 | 4.3 | 123.4 | 373.1 | 500.9 | 584.9 |
| sorzs.inspect | 272 | 2.2 | 107.5 | 314.9 | 450.4 | 516.2 |
| sorzs.list | 1278 | 10.6 | 2.6 | 191.7 | 280.3 | 417.5 |
| sorzs.search | 2760 | 22.8 | 104.9 | 345.1 | 464.9 | 611.5 |
| sorzs.census | 9 | 0.1 | 137.2 | 238.3 | 254.3 | 258.3 |
| users.list | 231 | 1.9 | 10.6 | 153.2 | 388.5 | 416.5 |
| users.add | 63 | 0.5 | 240.0 | 382.1 | 401.8 | 416.4 |
| users.setRole | 62 | 0.5 | 11.2 | 195.5 | 274.4 | 362.6 |

0 of 5411 replies were not ok. Container CPU avg 33 % and max 99 % of 200 %, memory max 109 MiB.
