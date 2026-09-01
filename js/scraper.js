(function () {
  'use strict';

  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  function plugin() {
    if (!isNative()) return null;
    try {
      return window.Capacitor.Plugins.Scraper || null;
    } catch (_) {
      return null;
    }
  }

  function saveScraped(products) {
    let added = 0;
    return ShopDB.all('products').then((existing) => {
      const seen = new Set(existing.map((p) => (p.shopeeId ? 'id:' + p.shopeeId : 't:' + (p.title || '').trim().toLowerCase())));
      const chain = Promise.resolve();
      products.forEach((p) => {
        const key = p.shopeeId ? 'id:' + p.shopeeId : 't:' + (p.title || '').trim().toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        added++;
        chain.then(() => ShopDB.put('products', { ...p, createdAt: new Date().toISOString() }));
      });
      return chain.then(() => added);
    });
  }

  window.ShopScraper = { isNative, plugin, saveScraped };
})();
