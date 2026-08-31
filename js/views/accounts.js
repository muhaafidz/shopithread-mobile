(function () {
  'use strict';

  const COLORS = ['#ff6a3d', '#8b5cf6', '#34d399', '#f59e0b', '#38bdf8', '#f472b6'];

  const AccountsView = {
    render() {
      const s = App.state;
      const activeId = s.settings.activeAccountId;

      return `
        <div class="pane-head"><h2>Accounts <span class="sub">Profiles for your Threads accounts</span></h2></div>

        ${s.accounts.length === 0
          ? `<div class="empty"><div class="big">👤</div><p>Add your Threads accounts here. Each profile gets its own caption style, hashtags, and reply audience.</p></div>`
          : `<div class="list">${s.accounts.map((a) => this.item(a, a.id === activeId)).join('')}</div>`}

        <button class="btn btn-ghost btn-full" id="btnAddAccount" style="margin-top:12px;">➕ Add Account</button>
        <div class="hint" style="margin-top:10px;">
          Posting opens the Threads app with the caption pre-filled — switch the active profile inside the Threads app itself
          (the app always posts from the profile that is currently selected). The reminder before posting keeps you safe.
        </div>`;
    },

    item(a, isActive) {
      return `
        <div class="item" data-id="${App.esc(a.id)}">
          <span class="acct-dot" style="background:${App.esc(a.color || COLORS[0])}; width:34px; height:34px; border-radius:11px;"></span>
          <div class="item-body">
            <b>${App.esc(a.name)} ${isActive ? '<span class="chip green">ACTIVE</span>' : ''}</b>
            <div class="meta">
              <span>Replies: ${App.esc((a.replyControl || 'everyone').replace(/_/g, ' '))}</span>
            </div>
          </div>
          <div class="item-actions">
            <button class="icon-action act-use" title="${isActive ? 'Active account' : 'Set active'}">${isActive ? '✓' : '👆'}</button>
            <button class="icon-action act-edit" title="Edit">✏️</button>
            <button class="icon-action danger act-del" title="Delete">🗑️</button>
          </div>
        </div>`;
    },

    bind() {
      const s = App.state;

      document.getElementById('btnAddAccount').onclick = () => this.openEditor(null);

      document.querySelectorAll('.item .act-use').forEach((btn) => {
        btn.onclick = async () => {
          s.settings.activeAccountId = btn.closest('.item').dataset.id;
          await App.persistSettings();
          await App.refreshData();
          App.refreshAllViews();
          App.rerender();
          App.toast('Active account updated');
        };
      });

      document.querySelectorAll('.item .act-edit').forEach((btn) => {
        btn.onclick = () => {
          const a = s.accounts.find((x) => x.id === btn.closest('.item').dataset.id);
          if (a) this.openEditor(a);
        };
      });

      document.querySelectorAll('.item .act-del').forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.closest('.item').dataset.id;
          const a = s.accounts.find((x) => x.id === id);
          if (!confirm('Delete account "' + (a ? a.name : '') + '"?')) return;
          await ShopDB.delete('accounts', id);
          if (s.settings.activeAccountId === id) {
            s.settings.activeAccountId = null;
            await App.persistSettings();
          }
          await App.refreshData();
          App.refreshAllViews();
          App.rerender();
        };
      });
    },

    openEditor(account) {
      const a = account || {};
      App.openModal(`
        <div class="modal-head">
          <h3>${account ? '✏️ Edit Account' : '➕ Add Account'}</h3>
          <button class="icon-btn" data-close>✕</button>
        </div>
        <label>Account name *</label>
        <input type="text" id="acName" value="${App.esc(a.name || '')}" placeholder="e.g. Gadgets MY, Racun Kitchen">
        <label>Color</label>
        <div class="row" id="acColors" style="gap:8px;">
          ${COLORS.map((c, i) => `<button class="icon-btn ac-color ${((a.color || COLORS[0]) === c) ? 'btn-primary' : ''}" data-color="${c}" style="background:${c}; border:none; height:40px;"></button>`).join('')}
        </div>
        <label>Default reply audience</label>
        <select id="acReply">
          ${['everyone', 'accounts_you_follow', 'mentioned_only', 'followers_only'].map((r) => `<option value="${r}" ${r === (a.replyControl || 'everyone') ? 'selected' : ''}>${r.replace(/_/g, ' ')}</option>`).join('')}
        </select>
        <label>Default caption style</label>
        <select id="acStyle">
          ${ThreadsContentService.getTemplates().map((t) => `<option value="${t.id}" ${t.id === (a.templateId || 'racun_shopee') ? 'selected' : ''}>${App.esc(t.name)}</option>`).join('')}
        </select>
        <div class="row" style="margin-top:16px;">
          <button class="btn btn-ghost" data-close>Cancel</button>
          <button class="btn btn-primary" id="acSave">💾 Save</button>
        </div>
      `);

      let color = a.color || COLORS[0];
      document.querySelectorAll('.ac-color').forEach((b) => {
        b.onclick = () => {
          color = b.dataset.color;
          document.querySelectorAll('.ac-color').forEach((x) => x.classList.remove('btn-primary'));
          b.classList.add('btn-primary');
        };
      });

      document.getElementById('acSave').onclick = async () => {
        const name = document.getElementById('acName').value.trim();
        if (!name) return App.toast('Account name is required', true);
        const row = {
          id: a.id || App.uid('acct'),
          name,
          color,
          replyControl: document.getElementById('acReply').value,
          templateId: document.getElementById('acStyle').value,
          createdAt: a.createdAt || new Date().toISOString()
        };
        await ShopDB.put('accounts', row);
        if (!a.id) {
          App.state.settings.activeAccountId = row.id;
          await App.persistSettings();
        }
        await App.refreshData();
        App.closeModal();
        App.rerender();
        App.toast(account ? 'Account updated' : 'Account added');
      };
    }
  };

  window.AccountsView = AccountsView;
})();
