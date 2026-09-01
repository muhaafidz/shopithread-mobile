(function () {
  'use strict';

  const API = 'https://api.github.com';

  function headers(token) {
    return {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };
  }

  async function detectLogin(token) {
    const res = await fetch(API + '/user', { headers: headers(token) });
    if (!res.ok) throw new Error('GitHub token invalid or expired (' + res.status + ')');
    const user = await res.json();
    return user.login;
  }

  async function getData(token, owner, repo) {
    const res = await fetch(API + '/repos/' + owner + '/' + repo + '/contents/data.json', {
      headers: headers(token), cache: 'no-store'
    });
    if (res.status === 404) return { sha: null, data: { version: 1, products: [], queue: [] } };
    if (!res.ok) throw new Error('GitHub error ' + res.status + ' reading data.json');
    const json = await res.json();
    let data;
    try {
      data = JSON.parse(decodeURIComponent(escape(atob(json.content.replace(/\n/g, '')))));
    } catch (e) {
      throw new Error('data.json is not valid JSON');
    }
    return { sha: json.sha, data };
  }

  async function putData(token, owner, repo, sha, data) {
    data.updatedAt = new Date().toISOString();
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const res = await fetch(API + '/repos/' + owner + '/' + repo + '/contents/data.json', {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify({ message: 'sync ' + new Date().toISOString(), content, sha })
    });
    if (!res.ok) {
      let msg = 'GitHub error ' + res.status + ' writing data.json';
      try { const e = await res.json(); if (e.message) msg = e.message; } catch (_) {}
      throw new Error(msg);
    }
    return true;
  }

  function mergeByKey(local, remote, prefer) {
    const map = new Map();
    local.forEach((x) => map.set(x.id, x));
    remote.forEach((x) => {
      if (!map.has(x.id)) map.set(x.id, x);
    });
    return Array.from(map.values());
  }

  window.ShopSync = {
    detectLogin,
    getData,
    putData,
    mergeByKey,

    async pull(settings) {
      const token = (settings.syncToken || '').trim();
      if (!token) throw new Error('No GitHub token. Add it in Settings.');
      const owner = settings.syncOwner || 'muhaafidz';
      const repo = settings.syncRepo || 'shopithread-sync';
      const { data } = await this.getData(token, owner, repo);

      const beforeP = App.state.products.length;
      const beforeQ = App.state.queue.length;
      const products = mergeByKey(App.state.products, data.products || []);
      const queue = mergeByKey(App.state.queue, data.queue || []);
      for (const p of products) await ShopDB.put('products', p);
      for (const q of queue) await ShopDB.put('queue', q);
      await App.refreshData();
      return { pulledProducts: products.length - beforeP, pulledQueue: queue.length - beforeQ };
    },

    async push(settings) {
      const token = (settings.syncToken || '').trim();
      if (!token) throw new Error('No GitHub token. Add it in Settings.');
      const owner = settings.syncOwner || 'muhaafidz';
      const repo = settings.syncRepo || 'shopithread-sync';
      const { sha, data } = await this.getData(token, owner, repo);

      const merged = {
        version: 1,
        products: mergeByKey(data.products || [], App.state.products),
        queue: mergeByKey(data.queue || [], App.state.queue)
      };
      await this.putData(token, owner, repo, sha, merged);
      return { products: merged.products.length, queue: merged.queue.length };
    }
  };
})();
