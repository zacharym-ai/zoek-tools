# Lead capture across the tools

## What changed

**`capture.js`** — new. A report-capture gate, loaded on all 18 Zoek-branded
tool pages alongside `cta.js`. The two white-label pages deliberately do NOT
load it, same as `cta.js`, so no Zoek branding leaks into partner versions.

**`netlify/functions/leads.js`** — one addition. After saving to Supabase and
emailing Kesley, it now also forwards the lead to Compass. Wrapped in
try/catch so a Compass outage can never break tool capture.

## Why gate the report, not the tool

The tools work instantly with no signup, and that's why people use them.
Gating the tool itself would kill adoption. Gating the **saved or emailed
report** doesn't: someone who wants their results in writing will hand over
an email, and someone who won't was never a lead.

Before this, 2 of 20 pages captured anything. The other 18 gave away the whole
result and collected nothing.

## Wiring a tool up

**Option 1 — no JavaScript.** Add a button wherever results appear:

```html
<button data-zoek-report>Email me this report</button>
```

Pass context so the lead arrives useful to sales:

```html
<button data-zoek-report
        data-score-from="#overallScore"
        data-summary-from="#resultSummary">
  Email me this report
</button>
```

**Option 2 — from your code**, when results render:

```js
ZoekCapture.ask({
  tool: 'revenue_loss',
  business_name: biz.name,
  overall_score: 42,
  weak_areas: ['No mobile site', 'No reviews'],
  extra: { website: biz.url }
}).then(function (lead) {
  if (lead) downloadPdf();   // null means they closed it
});
```

The tool slug comes from the filename automatically, so each tool is tracked
separately and you find out which magnets actually produce business.

## Environment variable

Add in Netlify → Site settings → Environment variables:

```
COMPASS_URL = https://your-compass-app.vercel.app
```

Without it, capture works exactly as it does today and nothing forwards.

## What Compass does with it

Creates the lead, attaches the score and weak areas as sales context, routes it
to a closer, and generates the dated follow-up tasks. The score and weak areas
matter — a rep opening the lead sees *why* the business scored badly without
going back to the tool.
