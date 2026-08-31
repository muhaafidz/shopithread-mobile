(function () {
  'use strict';

  const SettingsView = {
    render() {
      const s = App.state.settings;
      return `
        <div class="pane-head"><h2>Settings <span class="sub">AI · data · about</span></h2></div>

        <div class="card">
          <h3>🤖 AI Generation (OpenRouter)</h3>
          <label>OpenRouter API key</label>
          <input type="password" id="setKey" value="${App.esc(s.openrouterKey)}" placeholder="sk-or-v1-..." autocomplete="off">
          <label>Model</label>
          <div class="row">
            <input type="text" id="setModel" value="${App.esc(s.model || 'google/gemini-2.5-flash')}" style="flex:2" placeholder="google/gemini-2.5-flash">
            <button class="btn btn-ghost btn-sm" id="btnListModels" style="flex:1">List models</button>
          </div>
          <select id="modelPicker" style="display:none; margin-top:8px;"></select>
          <label style="display:flex; align-items:center; gap:10px; margin-top:14px; cursor:pointer;">
            <input type="checkbox" id="setAiEnabled" ${s.aiEnabled ? 'checked' : ''} style="width:auto; transform:scale(1.3);">
            <span style="font-size:13px; color:var(--text);">Prefer AI mode in Studio by default</span>
          </label>
          <div class="hint">
            Get a key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">openrouter.ai/keys</a>.
            The key stays on this device only — it is never synced or uploaded. Gemini Flash models are strong at Bahasa Melayu and have a cheap/free tier.
          </div>
          <button class="btn btn-primary btn-full" id="btnSaveAi" style="margin-top:14px;">💾 Save AI Settings</button>
        </div>

        <div class="card">
          <h3>🌐 Posting defaults</h3>
          <label>Default reply audience</label>
          <select id="setReply">
            ${['everyone', 'accounts_you_follow', 'mentioned_only', 'followers_only'].map((r) => `<option value="${r}" ${r === s.replyControl ? 'selected' : ''}>${r.replace(/_/g, ' ')}</option>`).join('')}
          </select>
          <div class="hint">Accounts can override this per profile.</div>
          <button class="btn btn-primary btn-full" id="btnSavePosting" style="margin-top:14px;">💾 Save</button>
        </div>

        <div class="card">
          <h3>📱 Phone Sync (GitHub)</h3>
          <label>GitHub fine-grained token (shopithread-sync repo only)</label>
          <input type="password" id="setSyncToken" value="${App.esc(s.syncToken || '')}" placeholder="github_pat_..." autocomplete="off">
          <div class="row">
            <div><label>Owner</label><input type="text" id="setSyncOwner" value="${App.esc(s.syncOwner || 'muhaafidz')}"></div>
            <div><label>Repo</label><input type="text" id="setSyncRepo" value="${App.esc(s.syncRepo || 'shopithread-sync')}"></div>
          </div>
          <div class="row" style="margin-top:14px;">
            <button class="btn btn-primary btn-sm" id="btnSyncPull" style="flex:1">⬇️ Pull</button>
            <button class="btn btn-ghost btn-sm" id="btnSyncPush" style="flex:1">⬆️ Push</button>
          </div>
          <div class="hint">
            Create a fine-grained token at <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">github.com/settings/personal-access-tokens</a>
            with <b>Contents: Read and write</b> on <b>shopithread-sync</b> only. Payloads carry product data only — never keys or cookies.
          </div>
        </div>

        <div class="card">
          <h3>📦 Data</h3>
          <div class="row">
            <button class="btn btn-ghost btn-sm" id="btnExportAll" style="flex:1">⬇️ Export backup (JSON)</button>
            <button class="btn btn-ghost btn-sm" id="btnImportAll" style="flex:1">⬆️ Import backup</button>
          </div>
          <input type="file" id="importFile" accept=".json" style="display:none">
          <div class="hint">Everything is stored locally on this device (IndexedDB). Use backups to move data between devices — cloud sync arrives in Phase 2.</div>
        </div>

        <div class="card">
          <h3>ℹ️ About</h3>
          <p style="font-size:12.5px; color:var(--muted);">
            <b style="color:var(--text);">ShopiThread MY</b> — mobile caption studio for Shopee Malaysia affiliates.<br><br>
            A Malaysia-localized fork of <a href="https://github.com/sodikinnaa/shopithread" target="_blank" rel="noopener noreferrer" style="color:#ff8a65;">ShopiThread by sodikinnaa</a> (MIT).
            Caption engine: 7 Bahasa Melayu rojak templates + spintax, optional AI via OpenRouter.
            Posting opens the official Threads composer — nothing is auto-submitted.
          </p>
        </div>`;
    },

    bind() {
      const s = App.state.settings;

      document.getElementById('btnSaveAi').onclick = async () => {
        s.openrouterKey = document.getElementById('setKey').value.trim();
        s.model = document.getElementById('setModel').value.trim() || 'google/gemini-2.5-flash';
        s.aiEnabled = document.getElementById('setAiEnabled').checked;
        if (s.aiEnabled) StudioView.state.mode = 'ai';
        await App.persistSettings();
        App.toast('AI settings saved');
      };

      document.getElementById('btnListModels').onclick = async () => {
        const btn = document.getElementById('btnListModels');
        btn.disabled = true;
        btn.textContent = '...';
        try {
          const models = await ShopAI.listModels(document.getElementById('setKey').value.trim());
          const picker = document.getElementById('modelPicker');
          picker.innerHTML = models.map((m) => `<option value="${App.esc(m)}">${App.esc(m)}</option>`).join('');
          picker.style.display = 'block';
          picker.onchange = () => {
            document.getElementById('setModel').value = picker.value;
            App.toast('Model selected — remember to Save');
          };
          if (models.length === 0) App.toast('No free/Gemini models found', true);
        } catch (e) {
          App.toast(e.message, true);
        }
        btn.disabled = false;
        btn.textContent = 'List models';
      };

      document.getElementById('btnSavePosting').onclick = async () => {
        s.replyControl = document.getElementById('setReply').value;
        await App.persistSettings();
        App.toast('Posting defaults saved');
      };

      const saveSync = async () => {
        s.syncToken = document.getElementById('setSyncToken').value.trim();
        s.syncOwner = document.getElementById('setSyncOwner').value.trim() || 'muhaafidz';
        s.syncRepo = document.getElementById('setSyncRepo').value.trim() || 'shopithread-sync';
        await App.persistSettings();
      };

      const syncBtn = (id, fn) => {
        document.getElementById(id).onclick = async () => {
          const btn = document.getElementById(id);
          const label = btn.textContent;
          btn.disabled = true;
          btn.textContent = '⏳ Syncing...';
          try {
            await saveSync();
            const res = await fn(s);
            App.refreshAllViews();
            if (id === 'btnSyncPull') App.toast('Pulled: +' + res.pulledProducts + ' products, +' + res.pulledQueue + ' queue');
            else App.toast('Pushed: ' + res.products + ' products, ' + res.queue + ' queue items');
          } catch (e) {
            App.toast(e.message, true);
          }
          btn.disabled = false;
          btn.textContent = label;
        };
      };
      syncBtn('btnSyncPull', (st) => ShopSync.pull(st));
      syncBtn('btnSyncPush', (st) => ShopSync.push(st));

      document.getElementById('btnExportAll').onclick = async () => {
        const data = await ShopDB.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'shopithread_backup_' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        App.toast('Backup downloaded');
      };

      const importInput = document.getElementById('importFile');
      document.getElementById('btnImportAll').onclick = () => importInput.click();
      importInput.addEventListener('change', async () => {
        const file = importInput.files[0];
        importInput.value = '';
        if (!file) return;
        if (!confirm('Importing replaces ALL current data on this device. Continue?')) return;
        try {
          const data = JSON.parse(await file.text());
          await ShopDB.importAll(data);
          await App.refreshData();
          App.refreshAllViews();
          App.toast('Backup imported');
        } catch (e) {
          App.toast('Invalid backup file', true);
        }
      });
    }
  };

  window.SettingsView = SettingsView;
})();
