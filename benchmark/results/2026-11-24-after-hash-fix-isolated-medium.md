# Isolated operations

Date 2026-11-24, backend commit f70771b plus the uncommitted benchmark code, profile medium (50 virtual users, 1 s pause, 2 minutes). Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.

| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms | Replies not ok | CPU avg / max % | Memory max MiB |
|---|---|---|---|---|---|---|---|---|---|
| health.check | 6000 | 49.8 | 1.2 | 4.2 | 8.2 | 19.9 | 0 | 1 / 3 | 17 |
| auth.login | 1510 | 11.8 | 2717.9 | 6997.5 | 8359.4 | 10573.7 | 0 | 199 / 202 | 149 |
| sorzs.add | 5345 | 44.1 | 121.8 | 141.4 | 161.9 | 745.8 | 0 | 19 / 100 | 79 |
| sorzs.inspect | 5450 | 45.3 | 101.5 | 105.4 | 111.6 | 130.0 | 0 | 9 / 98 | 80 |
| sorzs.list | 6000 | 49.7 | 1.8 | 8.6 | 22.3 | 33.8 | 0 | 12 / 97 | 78 |
| sorzs.search | 5450 | 45.2 | 102.2 | 109.1 | 122.1 | 142.9 | 0 | 14 / 99 | 80 |
| sorzs.census | 1229 | 9.8 | 3123.3 | 7399.8 | 8747.8 | 9247.9 | 0 | 113 / 117 | 96 |
| users.list | 5950 | 49.2 | 7.2 | 42.2 | 70.1 | 128.0 | 0 | 31 / 100 | 81 |
| users.add | 1050 | 8.4 | 4325.3 | 10802.0 | 14113.9 | 17090.5 | 0 | 186 / 201 | 161 |
| users.setRole | 5950 | 49.3 | 5.8 | 38.2 | 73.5 | 130.2 | 0 | 29 / 98 | 79 |
