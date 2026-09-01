(function () {
  if (window.__ST_SCRAPER__) return;
  window.__ST_SCRAPER__ = true;

  var cancelled = false;
  var running = false;

  function bridge() {
    return window.AndroidBridge || null;
  }

  function report(text, pct) {
    try {
      var b = bridge();
      if (b) b.progress(JSON.stringify({ text: text, pct: pct || 0 }));
    } catch (e) {}
    var el = document.getElementById('__st_status');
    if (el) el.textContent = text;
  }

  function buildOverlay() {
    if (document.getElementById('__st_bar')) return;
    var bar = document.createElement('div');
    bar.id = '__st_bar';
    bar.style.cssText = 'position:fixed;left:10px;right:10px;bottom:14px;z-index:2147483645;' +
      'background:#0b1120;color:#fff;border:1px solid rgba(148,163,184,.4);border-radius:14px;' +
      'padding:10px 12px;font:12.5px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);';
    bar.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
      '<span id="__st_found" style="font-weight:800;">Products: 0</span>' +
      '<select id="__st_pages" style="background:#111827;color:#fff;border:1px solid rgba(148,163,184,.4);border-radius:8px;padding:4px 6px;font-size:12px;">' +
      '<option value="1">1 page</option><option value="2">2 pages</option><option value="3">3 pages</option>' +
      '<option value="5">5 pages</option><option value="10">10 pages</option></select>' +
      '<button id="__st_start" style="background:linear-gradient(120deg,#ff8a65,#ee4d2d,#8b5cf6);color:#fff;border:none;border-radius:9px;padding:6px 14px;font-weight:800;cursor:pointer;">▶ Scrape</button>' +
      '<button id="__st_stop" style="display:none;background:rgba(248,113,113,.15);color:#f87171;border:1px solid rgba(248,113,113,.4);border-radius:9px;padding:6px 12px;font-weight:700;cursor:pointer;">Stop</button>' +
      '</div>' +
      '<div id="__st_status" style="margin-top:6px;color:#94a3b8;">Ready. Log in first if needed, then tap ▶.</div>';
    document.body.appendChild(bar);
    document.getElementById('__st_start').addEventListener('click', start);
    document.getElementById('__st_stop').addEventListener('click', function () { cancelled = true; });
    updateFound();
  }

  function updateFound() {
    var el = document.getElementById('__st_found');
    if (el) el.textContent = 'Products: ' + findProductItems().length;
  }

  function findProductItems() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.product-offer-list .product-offer-item, .product-offer-item'));
    if (items.length === 0) items = Array.prototype.slice.call(document.querySelectorAll('.AffiliateItemCard, [class*="AffiliateItemCard"]'));
    if (items.length === 0) items = Array.prototype.slice.call(document.querySelectorAll('ul.shopee-search-item-result__items li.shopee-search-item-result__item, [class*="shopee-search-item-result__item"]'));
    if (items.length === 0) items = Array.prototype.slice.call(document.querySelectorAll('.ant-table-row, .offer-item, [data-sq*="product-card"], .goods-item'));
    return items;
  }

  function extractMeta(item, index) {
    var nameEl = item.querySelector('.ItemCard__name') || item.querySelector('[role="group"]') ||
      item.querySelector('.shopee-search-item-result__item-name') || item.querySelector('[class*="item-name"]') ||
      item.querySelector('[class*="title"]');
    var imgEl = item.querySelector('.ItemCard__image img') || item.querySelector('img[src*="susercontent.com"]') ||
      item.querySelector('picture img') || item.querySelector('img');
    var priceEl = item.querySelector('.ItemCard__price .price') || item.querySelector('.ItemCard__price') || item.querySelector('[class*="price"]');
    var soldEl = item.querySelector('.ItemCardSold__wrap span') || item.querySelector('.ItemCardSold__wrap') || item.querySelector('[class*="sold"]');
    var commEl = item.querySelector('.commRate') || item.querySelector('[class*="commission"]') || item.querySelector('[class*="rate"]');

    var cleanImg = '';
    if (imgEl && imgEl.src) cleanImg = imgEl.src.replace(/@resize_[^.\s]+/, '').split('?')[0];

    var rawTitle = nameEl ? nameEl.textContent.trim() : (imgEl && imgEl.alt) || ('product_' + index);
    rawTitle = rawTitle.replace(/^Product card:\s*/i, '');
    var priceText = priceEl ? priceEl.textContent.trim() : '-';

    var linkEl = item.querySelector('a[href*="/offer/product_offer/"]') || item.querySelector('a[href*="shopee.com.my"]');
    var shopeeId = '';
    var longLink = '';
    if (linkEl && linkEl.href) {
      longLink = linkEl.href;
      var m = linkEl.href.match(/product_offer\/(\d+)/) || linkEl.href.match(/i\.\d+\.(\d+)/);
      if (m) shopeeId = m[1];
    }

    return {
      id: 'shp_' + (shopeeId || Date.now()) + '_' + index,
      shopeeId: shopeeId,
      title: rawTitle,
      safeTitle: rawTitle.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_').substring(0, 40) || ('product_' + index),
      cleanImgUrl: cleanImg,
      image: cleanImg,
      price: priceText.indexOf('RM') === 0 ? priceText : (priceText !== '-' ? 'RM ' + priceText : '-'),
      commission: commEl ? commEl.textContent.trim() : '-',
      rating: '4.9',
      sold: soldEl ? soldEl.textContent.trim() : '1k+ terjual',
      longLink: longLink || location.href,
      createdAt: new Date().toISOString()
    };
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  async function fetchShortLink(item) {
    var btn = item.querySelector('.AffiliateItemCard__getlinkBtn') || item.querySelector('button.ant-btn') ||
      Array.prototype.slice.call(item.querySelectorAll('button, a')).find(function (b) {
        var t = (b.textContent || '').trim();
        return t.indexOf('Get Link') >= 0 || t.indexOf('Create Link') >= 0 || t.indexOf('Dapatkan Link') >= 0 || t.indexOf('Buat Link') >= 0 || t.indexOf('Share') >= 0 || t.indexOf('Kongsi') >= 0;
      });
    if (!btn) {
      var anchor = item.querySelector('a[href*="/offer/"], a[href*="shopee.com.my"]');
      return anchor ? anchor.href : location.href;
    }
    try { btn.click(); } catch (e) {}
    for (var attempt = 0; attempt < 40; attempt++) {
      await sleep(100);
      if (cancelled) break;
      if (attempt === 15 && !document.querySelector('.ant-modal-root, .ant-modal, [role="dialog"]')) {
        try { btn.click(); } catch (e) {}
      }
      var modal = document.querySelector('.ant-modal-root, .ant-modal, [role="dialog"]');
      if (modal) {
        var inputs = Array.prototype.slice.call(modal.querySelectorAll('input, textarea'));
        var linkInput = null;
        for (var i = 0; i < inputs.length; i++) {
          var v = inputs[i].value || '';
          if (v.indexOf('http') >= 0 || v.indexOf('shopee') >= 0 || v.indexOf('shope.ee') >= 0) { linkInput = inputs[i]; break; }
        }
        var extracted = linkInput ? linkInput.value.trim() : '';
        if (!extracted) {
          var m = modal.innerText.match(/https?:\/\/[^\s]+/);
          if (m) extracted = m[0].trim();
        }
        if (extracted) {
          var um = extracted.match(/https?:\/\/[^\s"'<>\\]+/);
          if (um) extracted = um[0];
          var closeBtn = modal.querySelector('.ant-modal-close, .ant-modal-close-x, button[aria-label="Close"], .close');
          if (closeBtn) closeBtn.click();
          else {
            var overlay = document.querySelector('.ant-modal-wrap, .ant-modal-mask');
            if (overlay) overlay.click();
          }
          await sleep(500);
          return extracted;
        }
      }
    }
    var anchor2 = item.querySelector('a[href*="/offer/"], a[href*="shopee.com.my"]');
    return anchor2 ? anchor2.href : location.href;
  }

  async function goToNextPage() {
    var nextBtn = document.querySelector('.offer-list-page .page-item.page-next') ||
      document.querySelector('.ant-pagination-next:not(.ant-pagination-disabled) button') ||
      document.querySelector('.ant-pagination-next:not(.ant-pagination-disabled) a') ||
      document.querySelector('.ant-pagination-next:not(.ant-pagination-disabled)');
    if (!nextBtn) return false;
    var oldTitle = '';
    var firstItem = findProductItems()[0];
    if (firstItem) {
      var n = firstItem.querySelector('.ItemCard__name');
      oldTitle = n ? n.textContent.trim() : '';
    }
    try {
      nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {}
    var target = nextBtn.querySelector('a, button, .ant-pagination-item-link') || nextBtn;
    try {
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      if (typeof target.click === 'function') target.click();
    } catch (e) {}
    for (var i = 0; i < 40; i++) {
      await sleep(200);
      if (document.querySelector('.ant-spin-spinning, .ant-spin-nested-loading > div.ant-spin')) continue;
      var items = findProductItems();
      if (items.length > 0) {
        var n2 = items[0].querySelector('.ItemCard__name');
        var t2 = n2 ? n2.textContent.trim() : '';
        if (t2 && t2 !== oldTitle) { await sleep(600); return true; }
      }
    }
    await sleep(800);
    return true;
  }

  async function scrapeAll(maxPages, delayMs) {
    var products = [];
    var total = 0;
    for (var page = 1; page <= maxPages; page++) {
      if (cancelled) break;
      var items = findProductItems();
      report('Page ' + page + ': ' + items.length + ' products…', Math.round((page - 1) / maxPages * 90));
      for (var i = 0; i < items.length; i++) {
        if (cancelled) break;
        total++;
        var meta = extractMeta(items[i], total);
        report('[p' + page + ' ' + (i + 1) + '/' + items.length + '] ' + meta.title.substring(0, 28), Math.round(((page - 1) / maxPages + (i / items.length) / maxPages) * 90));
        var shortLink = await fetchShortLink(items[i]);
        meta.shortLink = shortLink;
        products.push(meta);
        await sleep(delayMs);
      }
      if (cancelled) break;
      if (page < maxPages) {
        report('Moving to page ' + (page + 1) + '…', Math.round(page / maxPages * 90));
        var moved = await goToNextPage();
        if (!moved) { report('Next page unavailable — stopping.', 90); break; }
      }
    }
    return products;
  }

  async function start() {
    if (running) return;
    running = true;
    cancelled = false;
    var pagesSel = document.getElementById('__st_pages');
    var maxPages = pagesSel ? parseInt(pagesSel.value, 10) : 1;
    var delayMs = window.__ST_DELAY__ || 600;
    document.getElementById('__st_start').style.display = 'none';
    document.getElementById('__st_stop').style.display = 'inline-block';
    report('Scraping ' + maxPages + ' page(s)…', 2);
    try {
      var products = await scrapeAll(maxPages, delayMs);
      report('Done: ' + products.length + ' products. Saving…', 99);
      var b = bridge();
      if (b) b.done(JSON.stringify({ count: products.length, products: products }));
    } catch (e) {
      report('Error: ' + e.message);
      document.getElementById('__st_start').style.display = 'inline-block';
      document.getElementById('__st_stop').style.display = 'none';
      running = false;
    }
  }

  function boot() {
    buildOverlay();
    updateFound();
    setInterval(function () { if (!running) updateFound(); }, 1500);
    report('Ready. Log in if needed, then tap ▶ Scrape.', 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
