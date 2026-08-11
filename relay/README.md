# Brand Hyve form relay

One shared endpoint (`/api/lead`) that every client site's contact form posts to.
It exists because GHL's inbound webhook accepts **JSON only** and **never
redirects** — a native form POST aimed straight at it would navigate the visitor
to a raw JSON response. The relay:

1. accepts the browser's native `application/x-www-form-urlencoded` POST (zero JS),
2. forwards the lead as JSON to the client's GHL webhook (`_webhook` hidden field,
   sourced from `business.json > ghlWebhookUrl` at build time),
3. `303`-redirects the visitor to the site's `/thank-you/` page (`_redirect`),
   which is what GA4 conversion tracking keys off.

Switching a client between GHL and Google Forms is a `business.json` change —
the relay allowlists both webhook host families.

## Deploy

This folder is **not** part of the Astro build and must never be published
through the Hyve CMS (the CMS uploads static bundles only). Deploy it as its own
Vercel project:

```bash
cd relay
vercel --prod
```

Point `relay.brandhyve.com` at the deployment and keep
`formRelayUrl` in every client's `business.json` set to
`https://relay.brandhyve.com/api/lead`.

## Safety

- **Host allowlist** — forwards only to GHL (`leadconnectorhq.com`,
  `gohighlevel.com`, `msgsndr.com`) and Google Forms (`docs.google.com`), so the
  endpoint can't be used as an open proxy.
- **Honeypot** — a filled `company` field is treated as a bot: redirect,
  forward nothing.
- **Never strands the visitor** — webhook failures are logged (payload
  included, recoverable from function logs) and the visitor still lands on
  `/thank-you/`.
