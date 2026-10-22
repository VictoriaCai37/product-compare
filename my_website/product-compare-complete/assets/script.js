// ===== Shared Utilities =====
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const fmtPrice = (p, c='USD') => new Intl.NumberFormat('en-US', {style:'currency', currency:c, minimumFractionDigits: 0}).format(p);
const getParam = (name) => new URLSearchParams(location.search).get(name);

let DATA = null;
async function loadData() {
  if (DATA) return DATA;
  const res = await fetch('data/products.json', {cache:'no-store'});
  DATA = await res.json();
  return DATA;
}

// ===== Sidebar Rendering (shared) =====
async function renderSidebar(activeSlug=null) {
  const {categories} = await loadData();
  const ul = $('#sidebarCategories');
  if (!ul) return;
  ul.innerHTML = categories.map(c => `
    <li><a href="compare.html?category=${c.slug}" class="${c.slug === activeSlug ? 'active' : ''}">${c.name}</a></li>
  `).join('');
}

// ===== Sidebar Interactions (shared) =====
function initSidebar() {
  const sidebar = $('#sidebar');
  const resizeHandle = $('#resizeHandle');
  const sidebarToggle = $('#sidebarToggle');
  let isResizing = false, startX, startWidth;

  if (resizeHandle) {
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = sidebar.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const newWidth = startWidth + (e.clientX - startX);
      const minWidth = 200, maxWidth = 400;
      sidebar.style.width = Math.max(minWidth, Math.min(maxWidth, newWidth)) + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      sidebarToggle.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
    });
  }

  // Mobile: close sidebar on link click
  $$('.sidebar-nav a').forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth <= 768) sidebar.classList.remove('open');
  }));
}

// ===== Home Page =====
async function initHomePage() {
  await renderSidebar();
  initSidebar();
  const {categories} = await loadData();
  $('#statCategories').textContent = categories.length;
  $('#statProducts').textContent = categories.reduce((sum, c) => sum + c.products.length, 0);

  const grid = $('#comparisonGrid');
  if (grid) {
    grid.innerHTML = categories.slice(0, 6).map((c, i) => `
      <article class="comparison-card" style="animation: fadeInUp 0.5s ease both; animation-delay: ${i * 0.1}s;">
        <h4>${c.name}</h4>
        <p>${c.description}</p>
        <span class="card-meta">${c.products.length} products compared</span>
      </article>
    `).join('');
  }
}

// ===== Compare Page =====
async function initComparePage() {
  const catSlug = getParam('category');
  await renderSidebar(catSlug);
  initSidebar();

  const {categories} = await loadData();
  const cat = categories.find(c => c.slug === catSlug);
  if (!cat) { document.body.innerHTML = '<main style="padding:2rem;text-align:center">Category not found <a href="index.html">← Back to Home</a></main>'; return; }

  const base = location.origin;
  document.title = `${cat.name} Comparison - Product Compare`;
  $('#meta-desc').content = cat.description;
  $('#canonical').href = `${base}/compare.html?category=${catSlug}`;
  $('#og-title').content = document.title;
  $('#og-desc').content = cat.description;
  $('#og-img').content = cat.products[0]?.image || `${base}/assets/og-default.jpg`;
  $('#cat-name').textContent = `${cat.name} Comparison`;
  $('#cat-desc').textContent = cat.description;

  // Table header
  const specsKeys = ['Price', ...Object.keys(cat.products[0]?.specs || {})];
  $('#compare-table thead tr').innerHTML = specsKeys.map(k => `<th>${k}</th>`).join('');

  // Table body
  $('#compare-table tbody').innerHTML = cat.products.map(p => `
    <tr>
      <td><strong><a href="product.html?id=${p.id}">${p.name}</a></strong></td>
      <td>${fmtPrice(p.price, p.currency)}</td>
      ${Object.values(p.specs).map(v => `<td>${v}</td>`).join('')}
    </tr>`).join('');

  // Cards
  $('#cards').innerHTML = cat.products.map(p => `
    <article class="card">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <div class="card-body">
        <h3 class="card-title"><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="price">${fmtPrice(p.price, p.currency)}</div>
        <dl class="specs">${Object.entries(p.specs).map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
        <div class="pros-cons">
          <ul class="pros">${p.pros.map(x=>`<li>${x}</li>`).join('')}</ul>
          <ul class="cons">${p.cons.map(x=>`<li>${x}</li>`).join('')}</ul>
        </div>
        <a class="btn btn-primary" href="${p.affiliateUrl}" target="_blank" rel="sponsored nofollow" onclick="return confirm('You will be redirected to the retailer site. Continue?')">View Deal</a>
      </div>
    </article>`).join('');

  // JSON-LD ItemList
  const ld = {
    "@context":"https://schema.org","@type":"ItemList",
    "name":cat.name,"description":cat.description,
    "itemListElement":cat.products.map((p,i)=>({
      "@type":"ListItem","position":i+1,
      "item":{"@type":"Product","name":p.name,"image":p.image,"offers":{"@type":"Offer","price":p.price,"priceCurrency":p.currency,"url":p.affiliateUrl}}
    }))
  };
  $('#ld-json').textContent = JSON.stringify(ld);
}

// ===== Product Page =====
async function initProductPage() {
  const pid = getParam('id');
  await renderSidebar();
  initSidebar();

  const {categories} = await loadData();
  const product = categories.flatMap(c=>c.products).find(p=>p.id===pid);
  if (!product) { document.body.innerHTML = '<main style="padding:2rem;text-align:center">Product not found <a href="index.html">← Back to Home</a></main>'; return; }

  const base = location.origin;
  document.title = `${product.name} - Specs & Price`;
  $('#meta-desc').content = `${product.name} detailed specifications, pros & cons, pricing, and affiliate purchase links.`;
  $('#canonical').href = `${base}/product.html?id=${pid}`;
  $('#og-title').content = document.title;
  $('#og-desc').content = $('#meta-desc').content;
  $('#og-img').content = product.image;

  // JSON-LD Product
  const ld = {
    "@context":"https://schema.org","@type":"Product",
    "name":product.name,"image":product.image,"description":`${product.name} detailed specifications and pricing`,
    "offers":{"@type":"Offer","url":product.affiliateUrl,"price":product.price,"priceCurrency":product.currency,"availability":"https://schema.org/InStock"}
  };
  $('#ld-json').textContent = JSON.stringify(ld);

  $('#product-root').innerHTML = `
    <img src="${product.image}" alt="${product.name}" loading="eager">
    <div class="product-info">
      <h1>${product.name}</h1>
      <div class="price">${fmtPrice(product.price, product.currency)}</div>
      <div class="product-meta">
        ${Object.entries(product.specs).map(([k,v])=>`<span><strong>${k}</strong>${v}</span>`).join('')}
      </div>
      <h2>Pros</h2>
      <ul>${product.pros.map(x=>`<li>${x}</li>`).join('')}</ul>
      <h2>Cons</h2>
      <ul>${product.cons.map(x=>`<li>${x}</li>`).join('')}</ul>
      <a class="btn btn-primary" href="${product.affiliateUrl}" target="_blank" rel="sponsored nofollow" onclick="return confirm('You will be redirected to the retailer site. Continue?')">Buy Now</a>
    </div>`;
}

// Smooth scroll for anchor links
document.addEventListener('click', e=>{
  const a=e.target.closest('a[href^="#"]');
  if(a){e.preventDefault();document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'});}
});

// ===== Scenes Index (Homepage) =====
async function renderScenesIndex() {
  const grid = $('#scenesGrid');
  if (!grid) return;
  try {
    const res = await fetch('data/affiliate-picks.json', { cache: 'no-store' });
    const data = await res.json();
    grid.innerHTML = data.picks.map(s => `
      <a href="scene.html?slug=${s.sceneSlug}" class="scene-card">
        <h4>${s.sceneTitle}</h4>
        <p>${s.sceneDesc}</p>
        <span class="updated">Updated ${s.updated}</span>
      </a>
    `).join('');
  } catch (err) {
    console.error('Failed to load scenes index:', err);
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">Unable to load picks.</p>';
  }
}

// Hook into existing initHomePage
const originalInitHomePage = window.initHomePage;
window.initHomePage = async function() {
  await originalInitHomePage();
  await renderScenesIndex();
};
