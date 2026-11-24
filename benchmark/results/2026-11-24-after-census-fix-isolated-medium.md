# Isolated operations

Date 2026-11-24, backend commit ae9e033 plus the uncommitted benchmark code, profile medium (50 virtual users, 1 s pause, 2 minutes). Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.

| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms | Replies not ok | CPU avg / max % | Memory max MiB |
|---|---|---|---|---|---|---|---|---|---|
| health.check | 6000 | 49.8 | 1.0 | 4.4 | 9.3 | 27.3 | 0 | 1 / 2 | 14 |
| auth.login | 1102 | 8.8 | 3783.8 | 11106.4 | 13621.5 | 15753.9 | 0 | 193 / 201 | 149 |
| sorzs.add | 5362 | 44.3 | 118.4 | 136.3 | 157.9 | 741.8 | 0 | 16 / 100 | 80 |
| sorzs.inspect | 5450 | 45.3 | 101.0 | 103.1 | 107.2 | 138.6 | 0 | 8 / 100 | 80 |
| sorzs.list | 6000 | 49.8 | 1.0 | 6.4 | 27.3 | 94.8 | 0 | 10 / 99 | 80 |
| sorzs.search | 5450 | 45.3 | 101.2 | 107.5 | 129.7 | 147.9 | 0 | 11 / 100 | 80 |
| sorzs.census | 1078 | 8.4 | 4044.3 | 8859.0 | 10877.2 | 12288.7 | 0 | 111 / 118 | 93 |
| users.list | 5968 | 49.3 | 4.2 | 29.1 | 49.8 | 122.7 | 0 | 26 / 94 | 78 |
| users.add | 763 | 6.0 | 6071.6 | 13109.1 | 14501.3 | 14743.4 | 0 | 93 / 98 | 155 |
| users.setRole | 6000 | 49.6 | 2.9 | 17.7 | 38.6 | 81.0 | 0 | 20 / 99 | 80 |
