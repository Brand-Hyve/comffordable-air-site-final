/**
 * Brand Hyve form relay — the ONE shared endpoint every client site posts to.
 *
 * Why this exists: GHL's inbound webhook accepts JSON only and never
 * redirects, so a native (no-JS) form POST straight at it would navigate the
 * visitor to a raw JSON response. This relay accepts the browser's native
 * form-encoded POST, forwards the lead as JSON to the client's webhook, and
 * 303-redirects the visitor to the site's /thank-you/ page (GA4 conversion).
 *
 * Deployed SEPARATELY from any client site (the Hyve CMS publishes static
 * bundles only and cannot host serverless functions). Deploy this `relay/`
 * folder as its own Vercel project, e.g. https://relay.brandhyve.com.
 *
 * Routing is carried in hidden form fields, all driven by the site's
 * business.json at build time:
 *   _webhook   destination webhook URL (allowlisted hosts only)
 *   _redirect  where to send the visitor afterwards (the site's /thank-you/)
 *   _source    the page the form was submitted from
 *   company    honeypot — filled means bot; pretend success, forward nothing
 */

// Hosts we are willing to forward leads to. Keeps the relay from being used
// as an open proxy. Extend when a client needs a new destination type.
const WEBHOOK_HOST_ALLOWLIST = [
  /(^|\.)leadconnectorhq\.com$/i, // GoHighLevel inbound webhooks
  /(^|\.)gohighlevel\.com$/i,
  /(^|\.)msgsndr\.com$/i, // legacy GHL webhook domain
  /^docs\.google\.com$/i, // Google Forms formResponse endpoints
];

const FALLBACK_REDIRECT = 'https://www.brandhyve.com/';

function allowedWebhook(raw) {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return null;
    return WEBHOOK_HOST_ALLOWLIST.some((re) => re.test(url.hostname)) ? url : null;
  } catch {
    return null;
  }
}

function safeRedirect(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : FALLBACK_REDIRECT;
  } catch {
    return FALLBACK_REDIRECT;
  }
}

async function readBody(req) {
  // Vercel's Node runtime pre-parses known content types onto req.body.
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  const type = String(req.headers['content-type'] || '');
  if (type.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }

  const body = await readBody(req);
  const redirect = safeRedirect(body._redirect);

  // Honeypot tripped — pretend success, forward nothing.
  if (body.company) {
    res.statusCode = 303;
    res.setHeader('Location', redirect);
    return res.end();
  }

  const webhook = allowedWebhook(body._webhook);
  const payload = {
    name: String(body.name ?? ''),
    email: String(body.email ?? ''),
    phone: String(body.phone ?? ''),
    service: String(body.service ?? ''),
    message: String(body.message ?? ''),
    source: String(body._source ?? ''),
  };

  if (webhook) {
    try {
      const upstream = await fetch(webhook.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!upstream.ok) {
        console.error(`[relay] upstream ${webhook.hostname} responded ${upstream.status}`);
      }
    } catch (error) {
      // Never strand the visitor on an error page over a webhook hiccup — the
      // lead is logged so it can be recovered from the function logs.
      console.error('[relay] forward failed', error, JSON.stringify(payload));
    }
  } else {
    console.error('[relay] missing or non-allowlisted _webhook', String(body._webhook ?? ''));
  }

  res.statusCode = 303;
  res.setHeader('Location', redirect);
  return res.end();
}
