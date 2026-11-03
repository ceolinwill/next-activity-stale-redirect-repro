# Next.js: a redirect a page threw once replays when that page opens again (`cacheComponents`)

With `cacheComponents: true`, a page that calls `redirect()` on one soft navigation redirects again the next time it's opened, even when the new render doesn't redirect. Here `/a?to=b` redirects to `/b`. Afterwards, a `<Link href="/a">` on `/b` briefly commits `/a` and then bounces back to `/b`, so `/a` can't be opened until a full reload. With `cacheComponents: false` the same app works.

Reported in [vercel/next.js#92767 (comment)](https://github.com/vercel/next.js/issues/92767#issuecomment-6609017730). Related: [vercel/next.js#92615](https://github.com/vercel/next.js/pull/92615).

## Reproduction

```sh
npm install
npm run repro
```

`repro` builds the app, starts `next start`, and drives Chromium with Playwright: open `/`, click the link to `/a?to=b` (redirects to `/b`), then click the link to `/a`.

Output:

```txt
1. Soft navigation to /a?to=b redirected to: /b
2. Soft navigation to /a ended on: /b (heading: "Page B")
BUG: /a was redirected to /b again by the earlier /a?to=b redirect
```

The script exits with code 1. Set `cacheComponents: false` in `next.config.mjs` and it prints:

```txt
1. Soft navigation to /a?to=b redirected to: /b
2. Soft navigation to /a ended on: /a (heading: "Page A")
OK: /a rendered
```

## Expected

Navigating to `/a` renders Page A: its new render doesn't call `redirect()`.

## Actual

The navigation to `/a` commits, then the router replaces it with `/b`.

Where it goes wrong (`next/dist/client/components`):

1. The soft navigation to `/a?to=b` streams the page's `redirect()`. The page segment's `RedirectErrorBoundary` (`redirect-boundary.js`) catches it, and `HandleRedirect` calls `router.replace("/b")` and `reset()` in one transition.
2. `layout-router.js` keeps the `/a` page segment mounted in a hidden `<Activity>`. `reset()` clears the boundary's state, so it renders its children again. They still hold the redirect error, so `getDerivedStateFromError` latches the same redirect again. `HandleRedirect` is rendered inside the hidden Activity, and its effect waits there.
3. The navigation to `/a` reuses that segment, since search params aren't part of its state key. The boundary is still in its error state and renders `HandleRedirect` instead of the new children. When the Activity becomes visible, the effect reconnects and runs `router.replace("/b")` again.

## Environment

- next: `16.5.0-canary.38` (also seen on `16.4.3`)
- react, react-dom: `19.3.1`
- playwright: `1.64.1`
- Node.js: `24.22.0`
- macOS 27.2 (arm64)
