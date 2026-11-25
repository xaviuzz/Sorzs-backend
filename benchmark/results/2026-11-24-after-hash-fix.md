# Backend after the hash fix, 2026-11-24

Same setup as `2026-11-24-baseline.md`: one machine, backend in Docker with 2 CPUs, fake providers and page reader with 100 ms latency, 1000 users with 20 sorzs each, a clean `sorzs.db` for every pass. Not production figures. Backend commit `f70771b`. The files named `2026-11-24-after-hash-fix-*` hold the detail of each pass. This run is compared with the baseline and with `2026-11-24-after-census-fix.md`.

One change separates this run from the census one: `users.add` hashes through the async `Bun.password.hash` and no longer holds the only thread (`ecfc3c0`). Login already used the async `verify`; its code did not change.

## What the numbers say

1. **`users.add` no longer freezes the server.** A `health.check` probe at 10 per second measured it in a separate pass (`benchmark/k6/probe.js`): the probe's median went from 10 200 ms to 0 ms and `users.add` from 4.0 to 8.8 per second. The isolated pass agrees: 5.0 per second at the baseline, 6.0 after the census fix, 8.4 now; p50 from 6.2 s to 4.3 s. CPU rose from 93 % to 186 % of 200 %, which means both cores now work on hashes.
2. **Login and `users.add` cap at about 8 to 12 per second, and that is the CPU.** 170 ms of argon2id per hash on 2 cores gives at most about 12 per second. The auth.login pass went from 8.8 to 11.8 per second with no code change, so the difference between runs is noise of about 30 %. Only a cheaper hash or more cores raises this cap, and the cost of the hash is a security decision.
3. **The mixed scenario still gains, but little of it is the hash.** The total at the high profile went from 56 requests per second (baseline) to 234 (census fix) to 313 now. `users.add` and login are 2 % of the mix, so most of the last step is likely noise or the second core being free during their hashes; this run cannot separate the two. The p95 of `health.check` went from 2.7 s to 0.2 s (census fix) to 21 ms in the medium pass.
4. **Medium mixed has no waits left.** Every operation answers with p95 under 0.42 s, 0 of 5 573 replies not ok.
5. **The stress profile is not comparable call by call.** It aborts itself when p95 passes 1 s. It served 3 511 requests now, 1 674 after the census fix and 742 at the baseline.

## Reading the run

- No reply failed in any pass. Four passes printed an `EOF` line from k6; it was not investigated, and their counts of replies not ok are 0.
- Each figure is one run, and the same pass varies by about a third on this machine, which k6 shares with the container.
- The limits listed in the baseline still apply: assumed mixed weights, fixed 100 ms providers, one machine.
- Next ceiling by evidence: the CPU of the hash (login and `users.add`) and the single thread for everything else. Nothing here asks for a change before real traffic exists.
