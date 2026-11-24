# Isolated operations

Date 2026-11-24, backend commit c8216f2 plus the uncommitted benchmark code, profile medium (50 virtual users, 1 s pause, 2 minutes). Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.

| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms | Replies not ok | CPU avg / max % | Memory max MiB |
|---|---|---|---|---|---|---|---|---|---|
| health.check | 6000 | 49.8 | 0.7 | 3.7 | 8.3 | 26.8 | 0 | 1 / 4 | 12 |
| auth.login | 774 | 6.0 | 6164.8 | 16451.1 | 18798.5 | 19866.3 | 0 | 183 / 193 | 150 |
| sorzs.add | 5212 | 43.0 | 145.7 | 208.1 | 286.6 | 949.5 | 0 | 41 / 96 | 76 |
| sorzs.inspect | 5450 | 45.3 | 101.0 | 104.8 | 114.1 | 126.5 | 0 | 11 / 95 | 76 |
| sorzs.list | 5950 | 49.3 | 6.9 | 21.5 | 52.0 | 287.2 | 0 | 33 / 97 | 77 |
| sorzs.search | 5310 | 43.8 | 123.6 | 192.3 | 285.5 | 365.7 | 0 | 33 / 95 | 75 |
| sorzs.census | 105 | 0.7 | 60000.7 | 60004.8 | 60008.0 | 60009.2 | 93 | 95 / 102 | 76 |
| users.list | 5960 | 49.3 | 5.5 | 16.2 | 34.6 | 206.8 | 0 | 29 / 97 | 80 |
| users.add | 638 | 5.0 | 6169.0 | 14541.5 | 23405.6 | 27381.8 | 0 | 90 / 95 | 115 |
| users.setRole | 5950 | 49.3 | 7.1 | 35.4 | 69.7 | 91.0 | 0 | 33 / 99 | 78 |
