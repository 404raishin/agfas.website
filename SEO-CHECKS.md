# How to check the site's SEO

There is no single "SEO score" that predicts rankings. What tools give you is a
**technical checklist score** — whether a search engine *can* read the page
properly. That is necessary, but it is not the same as ranking well, which
depends on content, links and competition.

Use these four, in this order.

---

## 1. Lighthouse — the score people mean

Built into Chrome. Works on the live site or on `localhost`.

1. Open the page in Chrome
2. `F12` → **Lighthouse** tab
3. Tick **SEO**, **Accessibility**, **Performance**, **Best practices**
4. Choose **Mobile** (Google ranks on the mobile version)
5. **Analyze page load**

Run it on one of each page type — home, `/products`, a product page, `/about` —
not just the home page. They are built differently and score differently.

### From the command line

```bash
npx lighthouse https://agfasgas.com --only-categories=seo --view
```

---

## 2. PageSpeed Insights — the same audit, plus real-user data

<https://pagespeed.web.dev> — needs a public URL, so only after launch.

Worth using over local Lighthouse because it also shows **Core Web Vitals** from
actual Chrome users once the site has traffic. Those are a genuine ranking
signal; the Lighthouse score itself is not.

---

## 3. Google Search Console — the one that actually matters

<https://search.google.com/search-console>

Lighthouse guesses. Search Console tells you what Google really did.

**Set it up on launch day:**

1. Add property → **Domain** → `agfasgas.com`
2. Verify by adding the TXT record it gives you to your DNS
3. **Sitemaps** → submit `sitemap.xml`
4. **URL Inspection** → paste a product URL → *Request indexing*

Then check monthly:

- **Pages** — what is indexed, and why anything was excluded
- **Performance** — the searches people actually found you through
- **Core Web Vitals** and **Mobile Usability**

Expect nothing for the first week or two. Indexing a new domain is slow.

Bing has an equivalent worth 5 minutes: <https://www.bing.com/webmasters>

---

## 4. Rich Results Test — for product listings

<https://search.google.com/test/rich-results>

Checks whether Google can read your products as *products* — price, stock,
availability — rather than as ordinary pages. This is what puts prices in search
results and enables free Google Shopping listings.

**This site has no product structured data yet**, so this test will report none
found. See the improvements list.

---

## Current scores

Measured with Lighthouse 13 against a production build, mobile profile.

| Page | SEO | Accessibility | Best practices |
| --- | --- | --- | --- |
| Home | 100 | 100 | 100 |
| `/products` | 100 | 100 | — |
| Product page | 100 | 100 | 100 |
| `/about` | 100 | 100 | — |
| `/contact` | 100 | 100 | — |

Re-run these after any significant change, and after going live — the live
numbers will differ because of real network conditions and image sizes.

---

## What the score cannot tell you

A perfect 100 only means nothing is technically broken. Ranking for "gas leak
detector Malaysia" comes from things no audit measures:

- **Product photos and real descriptions** — thin pages rank poorly no matter
  how clean the markup. A product with a two-word description will underperform
  however good the score.
- **Content worth linking to** — the Safety notes section exists for this.
- **A Google Business Profile** — for a Malaysian supplier, local search is
  likely a bigger source of enquiries than organic web search.
- **Time.** New domains take months.
