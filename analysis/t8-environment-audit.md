# T8 — Environment audit: what each environment actually points at

Read-only. Every identity below is **returned by a tool**, never typed from a name.

## Measurement

```
$ npx vercel env pull --environment=<env> && grep -E '^(CONVEX_DEPLOYMENT|NEXT_PUBLIC_CONVEX_URL)='
```

| Vercel environment | `CONVEX_DEPLOYMENT` | `NEXT_PUBLIC_CONVEX_URL` |
|---|---|---|
| production | `dev:secret-parakeet-855` | `https://secret-parakeet-855.convex.cloud` |
| preview | `dev:secret-parakeet-855` | `https://secret-parakeet-855.convex.cloud` |
| development | `dev:secret-parakeet-855` | `https://secret-parakeet-855.convex.cloud` |

**All three environments are the same deployment.** There is no isolation between what a developer runs, what a preview serves, and what production serves.

The deployment's **kind** is likewise returned, not inferred from the `dev:` prefix in the name:

```
$ npx convex deployments
  URL: https://secret-parakeet-855.convex.cloud
  Deployment: secret-parakeet-855 (dev)
  Team: vantage-team
  Project: vantage-starter
```

`(dev)` comes from the service. The `dev:` in the variable is a string someone typed; this line is the service answering.

Serving check: `curl -sSL -o /dev/null -w '%{http_code}' https://vantage-starter.vercel.app/en` -> `200`. The site is live and it is served from a development backend.

## Why this is not tidiness

A development deployment can be reset, reseeded or wiped by ordinary development work — that is what it is for. Everything the live site serves is one routine command away from disappearing, with no warning and no restore path.

The second consequence is quieter and worse: **every "production" reading anyone has taken on this project has measured a development environment.** That is the failure this fleet has already paid for repeatedly — an instrument answering confidently about a scope nobody established.

## What was NOT measured, stated rather than assumed

I did not read the deployment identity out of the served JavaScript bundle. A bundle grep is the wrong surface for this question: vendor libraries ship example URLs, and a hit proves nothing about the app's configuration. The identity above comes from the environment store and from the service itself. (`phantom-string-registry.md`.)

## CLASS

- definition: an environment whose **name** asserts a guarantee its **wiring** does not provide
- sweep: every environment-scoped variable naming a deployment, with the deployment's kind as returned by the service -> the three rows above
- remaining: 0 environments unexamined; **3 of 3 misdescribed** — "production" and "preview" both name a development target

## The decision — not mine to fill in silently

Two outcomes are honest. Either is complete, provided it is written down.

1. **This project has no production yet.** Then the hosting production environment must stop claiming one: the README states which environments exist and what each points at, and the wiring reflects the claim.
2. **It should have one.** Then it is provisioned as a state change — its own deployment, its own keys, an audit trail, and a re-pull proving no development key survives on any production-scoped variable.

This is a product decision (does the starter ship with a live production, and who owns its data?), not a technical one. It is escalated, not guessed.

## Independent of that decision

Point 4 of the task stands either way: a check that **fails** if a production-scoped variable ever again names a development deployment. A rule nobody can re-break by accident is worth more than a corrected value — and today, the value cannot even be corrected without the decision above.
