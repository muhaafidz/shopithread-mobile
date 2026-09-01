(function () {
  'use strict';

  const DB_NAME = 'shopithread-my';
  const DB_VERSION = 1;
  const STORES = ['products', 'queue', 'accounts', 'settings'];
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        STORES.forEach((s) => {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
        });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx(store, mode, fn) {
    return open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const t = db.transaction(store, mode);
          const out = fn(t.objectStore(store));
          t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
          t.onerror = () => reject(t.error);
          t.onabort = () => reject(t.error);
        })
    );
  }

  const DB = {
    async all(store) {
      return tx(store, 'readonly', (s) => s.getAll());
    },
    async get(store, id) {
      return tx(store, 'readonly', (s) => s.get(id));
    },
    async put(store, value) {
      return tx(store, 'readwrite', (s) => s.put(value)).then(() => value);
    },
    async delete(store, id) {
      return tx(store, 'readwrite', (s) => s.delete(id));
    },
    async clear(store) {
      return tx(store, 'readwrite', (s) => s.clear());
    },

    async getSetting(key, fallback = null) {
      const row = await this.get('settings', key);
      return row ? row.value : fallback;
    },
    async setSetting(key, value) {
      return this.put('settings', { id: key, value });
    },

    async exportAll() {
      const [products, queue, accounts, settings] = await Promise.all([
        this.all('products'), this.all('queue'), this.all('accounts'), this.all('settings')
      ]);
      return { version: 1, exportedAt: new Date().toISOString(), products, queue, accounts, settings };
    },
    async importAll(data) {
      for (const store of STORES) {
        if (Array.isArray(data[store])) {
          await this.clear(store);
          for (const row of data[store]) await this.put(store, row);
        }
      }
    }
  };

  window.ShopDB = DB;
})();
