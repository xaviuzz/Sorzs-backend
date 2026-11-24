# Mixed scenario

Date 2026-11-24, backend commit c8216f2 plus the uncommitted benchmark code, profile medium. Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.

| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms |
|---|---|---|---|---|---|---|
| health.check | 129 | 1.1 | 7.4 | 2726.7 | 5313.4 | 5517.3 |
| auth.login | 38 | 0.3 | 270.2 | 3381.9 | 5519.8 | 5698.4 |
| sorzs.add | 439 | 3.6 | 141.8 | 2853.9 | 5670.0 | 5694.3 |
| sorzs.inspect | 197 | 1.6 | 120.0 | 2660.4 | 4564.5 | 5245.7 |
| sorzs.list | 1105 | 9.1 | 16.4 | 2212.4 | 4323.1 | 5517.5 |
| sorzs.search | 2110 | 17.4 | 125.5 | 2756.6 | 5194.3 | 5886.2 |
| sorzs.census | 10 | 0.1 | 2673.8 | 4883.6 | 5399.1 | 5527.9 |
| users.list | 156 | 1.3 | 19.4 | 4764.0 | 5462.1 | 5495.1 |
| users.add | 43 | 0.4 | 254.0 | 2379.8 | 2991.1 | 3054.9 |
| users.setRole | 41 | 0.3 | 7.7 | 2098.4 | 3885.8 | 4667.1 |

0 of 4268 replies were not ok. Container CPU avg 61 % and max 100 % of 200 %, memory max 109 MiB.
