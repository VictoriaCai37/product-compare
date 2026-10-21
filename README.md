# Product Compare - Affiliate Comparison Site

A pure static site for product comparisons with affiliate links. No build step, no Node.js, no frameworks - just HTML/CSS/JS that runs anywhere.

## Quick Deploy to Vercel (No Command Line)

1. Create GitHub repo (public) - e.g., product-compare
2. Upload all files via GitHub web: Add file -> Upload files -> drag this folder -> Commit
3. Vercel: https://vercel.com -> Add New Project -> select repo -> Deploy
4. Get your-project.vercel.app with auto HTTPS, global CDN, instant rollbacks
5. (Optional) Custom domain: Project -> Settings -> Domains -> Add -> follow DNS instructions

## Required Changes Before Launch

| File(s) | What to Change |
|---------|----------------|
| All HTML, robots.txt, sitemap.xml | Replace your-domain.vercel.app with your actual Vercel domain |
| data/products.json | Replace affiliateUrl values with your own affiliate links (Amazon Associates, ShareASale, etc.) |
| assets/og-default.jpg | Add a 1200x630 social preview image, or remove the og:image meta tags |

## Project Structure

```
product-compare/
├── index.html          # Homepage with category cards
├── compare.html        # Category comparison page (?category=slug)
├── product.html        # Product detail page (?id=productId)
├── assets/
│   ├── style.css       # Complete stylesheet (~8KB gzipped)
│   ├── script.js       # All rendering + sidebar logic (~5KB gzipped)
│   └── favicon.svg     # Emoji favicon
├── data/
│   └── products.json   # Single source of truth for all content
├── sitemap.xml         # Submit to Google Search Console
├── robots.txt
└── README.md
```

## How to Add Content

Edit only data/products.json:

```json
{
  "categories": [
    {
      "slug": "your-category",
      "name": "Display Name",
      "description": "SEO-friendly description for meta & schema.",
      "products": [
        {
          "id": "unique-id",
          "name": "Product Name",
          "price": 299,
          "currency": "USD",
          "image": "https://your-cdn.com/image.jpg",
          "affiliateUrl": "https://your-affiliate-network.com/tracking-link",
          "specs": {"Key Spec": "Value", "Another": "Value"},
          "pros": ["Pro 1", "Pro 2"],
          "cons": ["Con 1", "Con 2"]
        }
      ]
    }
  ]
}
```

Commit -> Vercel auto-redeploys in ~30 seconds.

## SEO Features Built-In

- Semantic HTML5: header, main, article, aside, footer
- Per-page title, meta description, canonical URL
- Open Graph + Twitter Card tags
- JSON-LD structured data:
  - Home: WebSite + SearchAction
  - Compare: ItemList of Product + Offer
  - Product: Product + Offer
- rel="sponsored nofollow" on all affiliate links (FTC/Google compliant)
- sitemap.xml + robots.txt ready for Search Console

## Responsive & Accessible

- Mobile-first: sidebar becomes off-canvas drawer on 768px and below
- Draggable desktop sidebar (200-400px) with collapse to icons (56px)
- WCAG AA contrast, focus states, semantic landmarks
- Lazy-loaded images, aspect-ratio for stable layout

## Common Pitfalls

| Issue | Fix |
|-------|-----|
| Images broken | Use HTTPS URLs; test in browser directly |
| Vercel deploy fails | Check JSON syntax, file paths, case sensitivity |
| Google not indexing | Submit sitemap.xml in Search Console; wait 1-2 weeks |
| No commissions | Verify affiliate links work, cookies not blocked, user purchases within cookie window |

## License

MIT - use commercially, modify freely, redistribute.
