// assets/scene-renderer.js
// Renders scene-based affiliate pick pages from data/affiliate-picks.json

(function() {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const fmtPrice = (p, c = 'USD') => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: c,
    minimumFractionDigits: 0
  }).format(p);

  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');

  if (!slug) {
    document.body.innerHTML = '<main style="padding:2rem;text-align:center;max-width:600px;margin:0 auto"><h1>Missing Scene</h1><p>Add <code>?slug=scene-slug</code> to the URL.</p><a href="index.html">← Back to Home</a></main>';
    return;
  }

  async function loadData() {
    const res = await fetch('data/affiliate-picks.json', { cache: 'no-store' });
    return res.json();
  }

  function buildSchema(scene, data) {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": scene.sceneTitle,
      "description": scene.sceneDesc,
      "itemListElement": scene.products.map((p, i) => {
        const pd = data.productDetails[p.id];
        const url = pd.affiliateLinks.amazon || pd.affiliateLinks.impact || pd.affiliateLinks.aliexpress || '#';
        return {
          "@type": "ListItem",
          "position": i + 1,
          "item": {
            "@type": "Product",
            "name": pd.name,
            "image": pd.image,
            "description": p.pickReason,
            "offers": {
              "@type": "Offer",
              "url": url,
              "price": pd.price,
              "priceCurrency": pd.currency,
              "availability": "https://schema.org/InStock"
            }
          }
        };
      })
    };
  }

  function renderScene(scene, data) {
    // SEO meta
    document.title = `${scene.sceneTitle} | GearLab`;
    $('#metaDesc').content = scene.sceneDesc;
    $('#canonical').href = location.origin + location.pathname + '?slug=' + slug;
    $('#og-title').content = document.title;
    $('#og-desc').content = scene.sceneDesc;
    $('#og-img').content = data.productDetails[scene.products[0]?.id]?.image || location.origin + '/assets/og-default.jpg';

    // Schema
    $('#schema').textContent = JSON.stringify(buildSchema(scene, data));

    // Hero
    $('#sceneTitle').textContent = scene.sceneTitle;
    $('#sceneDesc').textContent = scene.sceneDesc;
    $('#updatedDate').textContent = scene.updated;
    $('#disclosureBox').innerHTML = `<p>🔗 ${scene.disclosure}</p>`;
    $('#methodologyText').textContent = scene.methodology;

    // Render pick cards
    const grid = $('#picksGrid');
    scene.products.forEach(pick => {
      const pd = data.productDetails[pick.id];
      if (!pd) return;

      const tierLabels = {
        top: '🏆 Top Pick',
        budget: '💰 Budget Pick',
        upgrade: '⬆️ Upgrade Pick',
        apple: '🍎 Best for Apple'
      };
      const tierLabel = tierLabels[pick.pickTier] || pick.pickTier;

      const card = document.createElement('article');
      card.className = 'pick-card';
      card.innerHTML = `
        <div class="pick-badge">${tierLabel}</div>
        <img loading="lazy" src="${pd.image}" alt="${pd.name}" width="400" height="400">
        <h3>${pd.name}</h3>
        <p class="pick-reason">${pick.pickReason}</p>
        <div class="price-row"><span class="price">${fmtPrice(pd.price, pd.currency)}</span></div>
        <ul class="specs-mini">${Object.entries(pd.specs).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('')}</ul>
        <div class="pros-cons">
          <div class="pros"><ul>${pd.pros.map(x => `<li>✓ ${x}</li>`).join('')}</ul></div>
          <div class="cons"><ul>${pd.cons.map(x => `<li>✗ ${x}</li>`).join('')}</ul></div>
        </div>
        <div class="buy-btns">
          ${pd.affiliateLinks.amazon ? `<a class="btn btn-primary" href="${pd.affiliateLinks.amazon}" target="_blank" rel="sponsored nofollow ugc">Amazon</a>` : ''}
          ${pd.affiliateLinks.impact ? `<a class="btn btn-secondary" href="${pd.affiliateLinks.impact}" target="_blank" rel="sponsored nofollow ugc">Brand Store</a>` : ''}
          ${pd.affiliateLinks.aliexpress ? `<a class="btn btn-outline" href="${pd.affiliateLinks.aliexpress}" target="_blank" rel="sponsored nofollow ugc">AliExpress</a>` : ''}
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // Initialize
  loadData().then(data => {
    const scene = data.picks.find(s => s.sceneSlug === slug);
    if (!scene) {
      document.body.innerHTML = '<main style="padding:2rem;text-align:center;max-width:600px;margin:0 auto"><h1>Scene Not Found</h1><p>Check the slug in the URL.</p><a href="index.html">← Back to Home</a></main>';
      return;
    }
    renderScene(scene, data);
  }).catch(err => {
    console.error('Failed to load scene data:', err);
    document.body.innerHTML = '<main style="padding:2rem;text-align:center;max-width:600px;margin:0 auto"><h1>Error Loading Data</h1><p>Please try again later.</p><a href="index.html">← Back to Home</a></main>';
  });
})();
