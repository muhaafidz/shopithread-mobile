(function () {
  'use strict';

  const QueueView = {
    filter: 'ready',

    render() {
      const s = App.state;
      const items = s.queue.filter((q) => this.filter === 'all' || q.status === this.filter);
      const acctName = (id) => {
        const a = s.accounts.find((x) => x.id === id);
        return a ? a.name : null;
      };

      return `
        <div class="pane-head"><h2>Queue <span class="sub">${s.queue.filter((q) => q.status === 'ready').length} ready · ${s.queue.filter((q) => q.status === 'posted').length} posted</span></h2></div>
        <div class="account-strip">
          ${['ready', 'posted', 'all'].map((f) => `<span class="acct-pill ${this.filter === f ? 'active' : ''} clickable" data-filter="${f}">${f[0].toUpperCase() + f.slice(1)}</span>`).join('')}
        </div>
        ${items.length === 0
          ? `<div class="empty"><div class="big">📭</div><p>No ${this.filter === 'all' ? '' : this.filter + ' '}items. Generate a caption in the Studio and tap <b>Save to Queue</b>.</p></div>`
          : `<div class="list">${items.map((q) => this.item(q, acctName)).join('')}</div>`}`;
    },

    item(q, acctName) {
      return `
        <div class="item" data-id="${App.esc(q.id)}" style="align-items:flex-start;">
          <div class="item-body">
            <b>${App.esc(q.title || 'Caption')}</b>
            <div class="meta">
              <span class="chip ${q.status === 'posted' ? 'green' : 'orange'}">${q.status.toUpperCase()}</span>
              ${q.accountId && acctName(q.accountId) ? `<span>👤 ${App.esc(acctName(q.accountId))}</span>` : ''}
              <span>${new Date(q.createdAt || Date.now()).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' })}</span>
            </div>
            <div style="font-size:12px; color:var(--dim); margin-top:6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${App.esc((q.caption || '').split('\n')[0])}</div>
          </div>
          <div class="item-actions" style="flex-direction:column;">
            <button class="icon-action act-post" title="Post to Threads">🚀</button>
            <button class="icon-action act-copy" title="Copy caption">📋</button>
            <button class="icon-action danger act-del" title="Delete">🗑️</button>
          </div>
        </div>`;
    },

    bind() {
      const s = App.state;
      document.querySelectorAll('[data-filter]').forEach((el) => {
        el.onclick = () => { this.filter = el.dataset.filter; App.rerender(); };
      });

      document.querySelectorAll('.item .act-post').forEach((btn) => {
        btn.onclick = async () => {
          const q = s.queue.find((x) => x.id === btn.closest('.item').dataset.id);
          if (!q) return;
          const acct = s.accounts.find((a) => a.id === q.accountId);
          if (acct && !confirm('Posting as "' + acct.name + '". Make sure the Threads app is switched to this profile. Continue?')) return;
          window.open(App.threadsIntent(q.caption), '_blank');
          q.status = 'posted';
          q.postedAt = new Date().toISOString();
          await ShopDB.put('queue', q);
          await App.refreshData();
          App.rerender();
          App.toast('Marked as posted');
        };
      });

      document.querySelectorAll('.item .act-copy').forEach((btn) => {
        btn.onclick = async () => {
          const q = s.queue.find((x) => x.id === btn.closest('.item').dataset.id);
          if (q && (await App.copyText(q.caption))) App.toast('Caption copied');
        };
      });

      document.querySelectorAll('.item .act-del').forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.closest('.item').dataset.id;
          if (!confirm('Delete this queue item?')) return;
          await ShopDB.delete('queue', id);
          await App.refreshData();
          App.rerender();
        };
      });
    }
  };

  window.QueueView = QueueView;
})();
