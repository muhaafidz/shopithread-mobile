(function () {
  'use strict';

  const App = {
    state: {
      products: [],
      queue: [],
      accounts: [],
      settings: {
        openrouterKey: '',
        model: 'google/gemini-2.5-flash',
        aiEnabled: false,
        replyControl: 'everyone',
        activeAccountId: null,
        syncToken: '',
        syncOwner: 'muhaafidz',
        syncRepo: 'shopithread-sync'
      },
      activeTab: 'studio'
    }
  };

  window.App = App;

  App.esc = function esc(str) {
    return String(str === undefined || str === null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  App.uid = function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  };

  App.activeAccount = function activeAccount() {
    return App.state.accounts.find((a) => a.id === App.state.settings.activeAccountId) || null;
  };

  App.priceText = function priceText(p) {
    if (!p || !p.price) return '-';
    const s = String(p.price);
    return /^rm/i.test(s) ? s : 'RM ' + s.replace(/^rp\s*/i, '');
  };

  App.threadsIntent = function threadsIntent(text) {
    const acct = App.activeAccount();
    const rc = (acct && acct.replyControl) || App.state.settings.replyControl || 'everyone';
    let url = 'https://www.threads.com/intent/post?text=' + encodeURIComponent(text || '');
    if (rc && rc !== 'everyone') url += '&reply_control=' + encodeURIComponent(rc);
    return url;
  };

  App.copyText = async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      return ok;
    }
  };

  let toastTimer = null;
  App.toast = function toast(msg, isErr) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    if (toastTimer) clearTimeout(toastTimer);
    el.textContent = msg;
    el.classList.toggle('err', !!isErr);
    el.classList.add('show');
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  };

  App.openModal = function openModal(innerHtml) {
    let back = document.getElementById('modalBack');
    if (!back) {
      back = document.createElement('div');
      back.id = 'modalBack';
      back.className = 'modal-back';
      back.addEventListener('click', (e) => { if (e.target === back) App.closeModal(); });
      document.body.appendChild(back);
    }
    back.innerHTML = '<div class="modal">' + innerHtml + '</div>';
    back.classList.add('show');
    back.querySelectorAll('[data-close]').forEach((b) => (b.onclick = App.closeModal));
  };

  App.closeModal = function closeModal() {
    const back = document.getElementById('modalBack');
    if (back) back.classList.remove('show');
  };

  App.refreshData = async function refreshData() {
    const s = App.state;
    [s.products, s.queue, s.accounts] = await Promise.all([
      ShopDB.all('products'), ShopDB.all('queue'), ShopDB.all('accounts')
    ]);
    s.products.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    s.queue.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const settings = await ShopDB.getSetting('app', null);
    if (settings) Object.assign(s.settings, settings);
  };

  App.persistSettings = function persistSettings() {
    return ShopDB.setSetting('app', App.state.settings);
  };

  App.rerender = function rerender() {
    const views = { products: ProductsView, studio: StudioView, queue: QueueView, accounts: AccountsView, settings: SettingsView };
    const view = views[App.state.activeTab] || StudioView;
    const pane = document.getElementById('pane-' + App.state.activeTab);
    if (pane) pane.innerHTML = view.render();
    if (view.bind) view.bind();
  };

  App.switchTab = function switchTab(tab) {
    App.state.activeTab = tab;
    document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
    document.querySelectorAll('.bottom-nav button').forEach((b) => b.classList.remove('active'));
    const pane = document.getElementById('pane-' + tab);
    const btn = document.querySelector('.bottom-nav button[data-tab="' + tab + '"]');
    if (pane) pane.classList.add('active');
    if (btn) btn.classList.add('active');
    App.rerender();
    window.scrollTo({ top: 0 });
  };

  App.refreshAllViews = function refreshAllViews() {
    ['products', 'studio', 'queue', 'accounts'].forEach((t) => {
      const view = { products: ProductsView, studio: StudioView, queue: QueueView, accounts: AccountsView }[t];
      const pane = document.getElementById('pane-' + t);
      if (pane && (t === App.state.activeTab || pane.innerHTML)) pane.innerHTML = view.render();
      if (pane && view.bind && t === App.state.activeTab) view.bind();
    });
  };

  document.addEventListener('DOMContentLoaded', async () => {
    await App.refreshData();
    App.switchTab('studio');

    document.querySelectorAll('.bottom-nav button[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => App.switchTab(btn.dataset.tab));
    });

    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  });
})();
