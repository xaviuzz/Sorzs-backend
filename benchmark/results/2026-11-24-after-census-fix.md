# Backend after the census fix, 2026-11-24

Same setup as `2026-11-24-baseline.md`: one machine, backend in Docker with 2 CPUs, fake providers and page reader with 100 ms latency, 1000 users with 20 sorzs each, a clean `sorzs.db` for every pass. Not production figures. Backend commit `ae9e033`. The files named `2026-11-24-after-census-fix-*` hold the detail of each pass; the files without that prefix are the baseline they are compared with.

Two changes separate the two runs: `loadEveryList` reads every list in one query instead of one query per owner (`f014ce7`), and migration 5 indexes `entries` by owner and position (`ae9e033`). On the 20 000 entries the census went from about 2 800 ms to about 110 ms per call measured in-process, and `load(owner)` from 2.7 ms to 0.04 ms.

## What the numbers say

1. **The freeze is gone.** In the mixed medium pass p95 of `health.check` went from 2.7 s to 0.2 s, and every other operation went from 2 to 5 s down to under 0.4 s. The pass served 5 411 requests instead of 4 268, and the container CPU average fell from 61 % to 33 %.
2. **The census answers alone.** At 50 virtual users it served 1 078 calls with none lost, where 93 of 105 had timed out. It is still the slowest operation in its pass (p50 4.0 s, p95 8.9 s) because 50 users queue on one thread that is busy about 95 ms per call: CPU 111 % of 200 %. A pass that asks for the census without pause is not a use Sorzs expects.
3. **The mixed scenario holds much more load.** At the high profile the total went from about 56 to about 234 requests per second, and p95 from 24 to 42 s down to 4.4 to 7.4 s. It still saturates at that profile: p50 of 1.4 to 3.7 s.
4. **Login and `users.add` are now the weakest operations.** They cap at 6 to 9 calls per second (p50 3.8 s and 6.1 s at 50 virtual users) because `Bun.password.hashSync` holds the thread for about 160 ms per hash. Nothing in this change touched them; their figures differ from the baseline by up to 40 % between runs, which is the noise of this machine.
5. **The stress profile is not comparable call by call.** It ramps up users for 5 minutes and aborts itself when p95 passes 1 s, so its p95 depends on how far it got before aborting. It served 1 674 requests before aborting, where the baseline served 742, and the census took part in it (4 calls, none before).

## Limits of these figures

- The census alone gave p50 2.7 s in a first pass and 4.0 s in the second one. The machine is shared with k6 and other work, so the same pass varies by about a half.
- Each isolated figure is one run. The census pass was run twice, and the report keeps the second one.
- The limits listed in the baseline still apply: assumed mixed weights, fixed 100 ms providers, k6 and the container on one machine.
- Next ceiling by evidence: the hashing of login and `users.add`, and the single thread. Nothing here says that a census cache is needed.
