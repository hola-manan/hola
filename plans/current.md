# Zepp reconnect durability: auto-fresh-login when token renewal fails

**Standing instructions:** Implement this plan exactly. Do not touch anything outside the project directory; if an out-of-project need is discovered mid-run, list it at the end of your response instead of doing it. Do not commit.

## Problem (observed in prod 2026-07-20)

The nightly Zepp sync got stuck failing with `api_error: "zepp app_tokens failed:
HTTP 404"`. Root cause is in the recovery chain in
`app/functions/src/zeppSync.ts` → `fetchWithAuth`:

```ts
try {
  tokens = await renewAppToken(tokens)
} catch (e2) {
  if (!(e2 instanceof ZeppAuthError)) throw e2   // <-- bug
  tokens = await loginWithPassword(creds.email, creds.password)
}
```

When the cached **app token** dies, we renew off the **login token**. But if the
login token is *also* expired, Zepp's `app_tokens` endpoint returns **HTTP 404**,
which `renewAppToken` maps to `ZeppApiError` (not `ZeppAuthError`). The gate above
only falls back to a full `loginWithPassword` on `ZeppAuthError`, so a 404 is
rethrown and the sync fails permanently — a human has to manually clear the cached
token to recover.

The intent of this branch is: *"the cached tokens are unusable — get a completely
fresh pair."* A 404 (or any renew failure) means exactly that. So the fix is to
fall back to a fresh password login on **any** renew failure, not only auth errors.

## Change (single edit, `app/functions/src/zeppSync.ts`)

In `fetchWithAuth`, replace the inner renew/catch block so ANY renew failure falls
through to a fresh login:

```ts
// Dead app token: renew off the login token; if renewal fails for ANY reason
// (login token also expired -> Zepp 404s, auth reject, transient error), the
// cached credentials are unusable, so log in fresh.
try {
  tokens = await renewAppToken(tokens)
} catch {
  tokens = await loginWithPassword(creds.email, creds.password)
}
```

- Remove the `if (!(e2 instanceof ZeppAuthError)) throw e2` gate entirely.
- The surrounding `for (;;)` loop already sets `refreshed = true` after this block,
  so there is no infinite-loop risk: if the subsequent `fetchDays` still fails, the
  outer `if (!(e instanceof ZeppAuthError) || refreshed) throw e` rethrows.
- `ZeppAuthError` may no longer be referenced in this file after the edit. If so,
  remove it from the `./zepp` import to keep the build/lint clean. If it is still
  used elsewhere in the file, leave the import as-is. Do not touch anything else.

## Constraints for the implementing agent

- Change ONLY `app/functions/src/zeppSync.ts` (and its import line if `ZeppAuthError`
  becomes unused there). Do not modify `zepp.ts`, error classes, endpoints, or the
  encrypted login flow — those all work.
- Do NOT touch anything outside this project directory. If any out-of-repo need is
  discovered, list it at the end of your response instead of doing it.
- Do NOT run `firebase deploy`, do NOT commit. Claude handles deploy + commit after
  review.

## Verification (run in `app/functions/`)

- `npm run build` (tsc) must pass with no errors.
- If there is a lint script, run it; the unused-import case must not warn.
- `npx vitest run zepp` (or the functions test command) — existing `zepp.test.ts`
  must still pass.

## Out-of-repo follow-ups (Claude does these after verifying the diff)

- Deploy: `firebase deploy --only functions:zeppNightlySync,functions:syncZepp`
  from `hola/app`.
- No credential or scheduler changes needed.
