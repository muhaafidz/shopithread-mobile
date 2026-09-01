(function () {
  'use strict';

  const LIMIT = 500;

  const StudioView = {
    state: { productId: null, mode: 'template', styleId: 'racun_shopee', hashtagCategory: 'viral', hashtagCount: 3, caption: '', busy: false },

    render() {
      const s = App.state;
      const st = this.state;
      const acct = App.activeAccount();
      const product = s.products.find((p) => p.id === st.productId) || null;
      const templates = ThreadsContentService.getTemplates();

      const productOptions = s.products.length === 0
        ? '<option value="" disabled selected>-- No products yet — add one in Products --</option>'
        : '<option value="" disabled ' + (st.productId ? '' : 'selected') + '>-- Select a product --</option>' +
          s.products.map((p) => `<option value="${App.esc(p.id)}" ${p.id === st.productId ? 'selected' : ''}>${App.esc((p.title || '').slice(0, 46))} · ${App.esc(App.priceText(p))}</option>`).join('');

      return `
        <div class="pane-head"><h2>Caption Studio <span class="sub">Write · spin · post</span></h2></div>

        <div class="account-strip" id="acctStrip">
          <span class="acct-pill ${acct ? 'active' : 'no-acct'}" id="acctCurrent">👤 ${acct ? App.esc(acct.name) : 'No account selected'}</span>
        </div>

        <div class="card">
          <label>Product</label>
          <select id="studioProduct">${productOptions}</select>

          <label>Generation mode</label>
          <div class="row">
            <button class="btn ${st.mode === 'template' ? 'btn-primary' : 'btn-ghost'}" id="modeTemplate" style="flex:1">🎲 Template</button>
            <button class="btn ${st.mode === 'ai' ? 'btn-primary' : 'btn-ghost'}" id="modeAi" style="flex:1">🤖 AI (OpenRouter)</button>
          </div>

          <label>Caption style</label>
          <select id="studioStyle">
            ${templates.map((t) => `<option value="${t.id}" ${t.id === st.styleId ? 'selected' : ''}>${App.esc(t.name)}</option>`).join('')}
          </select>

          <div id="templateOpts" style="display:${st.mode === 'template' ? 'block' : 'none'};">
            <div class="row">
              <div>
                <label>Hashtag category</label>
                <select id="studioHtCat">
                  ${['viral', 'fashion', 'elektronik', 'home_living', 'beauty', 'food_snack'].map((c) => `<option value="${c}" ${c === st.hashtagCategory ? 'selected' : ''}>${c.replace('_', ' & ')}</option>`).join('')}
                </select>
              </div>
              <div>
                <label>Count</label>
                <select id="studioHtCount">${[2, 3, 4, 5].map((n) => `<option value="${n}" ${n === st.hashtagCount ? 'selected' : ''}>${n}</option>`).join('')}</select>
              </div>
            </div>
          </div>

          <button class="btn btn-primary btn-full" id="btnGenerate" style="margin-top:16px;" ${st.busy ? 'disabled' : ''}>
            ${st.busy ? '⏳ Generating...' : st.mode === 'ai' ? '🤖 Generate with AI' : '🎲 Spin Caption'}
          </button>
          ${st.mode === 'ai' && !s.settings.openrouterKey ? '<div class="hint">⚠️ No OpenRouter key yet — add it in <b>Settings</b>. Template mode still works offline.</div>' : ''}
        </div>

        <div class="card">
          <h3>✍️ Caption</h3>
          <textarea id="captionEditor" placeholder="Generate a caption or write your own...">${App.esc(st.caption)}</textarea>
          <div class="char-counter">
            <span id="charCount">${st.caption.length} / ${LIMIT}</span>
            <span id="charStatus" class="${st.caption.length > LIMIT ? 'over' : st.caption.length >= 450 ? 'warn' : 'ok'}">
              ${st.caption.length > LIMIT ? 'Over limit by ' + (st.caption.length - LIMIT) : 'Fits Threads'}
            </span>
          </div>
          <div class="row" style="margin-top:12px;">
            <button class="btn btn-primary" id="btnPostThreads" style="flex:2">🚀 Post to Threads</button>
            <button class="btn btn-ghost" id="btnCopyCaption" style="flex:1">📋 Copy</button>
          </div>
          <div class="row" style="margin-top:10px;">
            <button class="btn btn-ghost btn-sm" id="btnSaveQueue" style="flex:1">💾 Save to Queue</button>
            <button class="btn btn-ghost btn-sm" id="btnSavePhoto" style="flex:1" ${product && (product.image || '') ? '' : 'disabled'}>🖼️ Save Photo</button>
            <button class="btn btn-ghost btn-sm" id="btnCleanSymbols" style="flex:1">🧹 Clean</button>
          </div>
          ${acct && acct.replyControl && acct.replyControl !== 'everyone' ? `<div class="hint">Reply audience: <b>${App.esc(acct.replyControl.replace(/_/g, ' '))}</b> (account setting)</div>` : ''}
        </div>

        <div class="preview-card">
          <div class="preview-head">
            <div class="preview-avatar">🧵</div>
            <div class="preview-user"><b>${acct ? App.esc(acct.name) : 'your_handle'}</b><span>Threads preview · now</span></div>
          </div>
          <div class="preview-text" id="previewText">${App.esc(st.caption || 'Your caption preview appears here...')}</div>
          ${product && product.image ? `<img class="preview-img" id="previewImg" src="${App.esc(product.image)}" onerror="this.style.display='none'">` : ''}
        </div>`;
    },

    bind() {
      const st = this.state;
      const s = App.state;

      const acct = App.activeAccount();
      const strip = document.getElementById('acctStrip');
      if (strip) strip.onclick = () => App.switchTab('accounts');
      void acct;

      const productSel = document.getElementById('studioProduct');
      productSel.addEventListener('change', () => {
        st.productId = productSel.value || null;
        App.rerender();
      });

      document.getElementById('modeTemplate').onclick = () => { st.mode = 'template'; App.rerender(); };
      document.getElementById('modeAi').onclick = () => { st.mode = 'ai'; App.rerender(); };
      document.getElementById('studioStyle').addEventListener('change', (e) => { st.styleId = e.target.value; });
      const htCat = document.getElementById('studioHtCat');
      if (htCat) htCat.addEventListener('change', (e) => { st.hashtagCategory = e.target.value; });
      const htCount = document.getElementById('studioHtCount');
      if (htCount) htCount.addEventListener('change', (e) => { st.hashtagCount = parseInt(e.target.value, 10); });

      document.getElementById('btnGenerate').onclick = () => this.generate();

      const editor = document.getElementById('captionEditor');
      editor.addEventListener('input', () => {
        st.caption = editor.value;
        this.updateCount(st.caption);
        document.getElementById('previewText').textContent = st.caption || 'Your caption preview appears here...';
      });

      document.getElementById('btnPostThreads').onclick = () => {
        if (!st.caption.trim()) return App.toast('Caption is empty', true);
        window.open(App.threadsIntent(st.caption.trim()), '_blank');
      };

      document.getElementById('btnCopyCaption').onclick = async () => {
        if (!st.caption.trim()) return App.toast('Caption is empty', true);
        if (await App.copyText(st.caption)) App.toast('Caption copied');
      };

      document.getElementById('btnSaveQueue').onclick = async () => {
        if (!st.caption.trim()) return App.toast('Caption is empty', true);
        const product = s.products.find((p) => p.id === st.productId);
        await ShopDB.put('queue', {
          id: App.uid('q'),
          accountId: s.settings.activeAccountId,
          productId: product ? product.id : null,
          title: product ? product.title : 'Manual caption',
          caption: st.caption.trim(),
          image: product ? (product.image || '') : '',
          status: 'ready',
          createdAt: new Date().toISOString()
        });
        await App.refreshData();
        App.toast('Saved to Queue');
      };

      document.getElementById('btnSavePhoto').onclick = () => {
        const product = s.products.find((p) => p.id === st.productId);
        if (product && product.image) window.open(product.image, '_blank');
      };

      document.getElementById('btnCleanSymbols').onclick = () => {
        if (!st.caption) return;
        st.caption = ThreadsContentService.stripEmojis(st.caption);
        editor.value = st.caption;
        this.updateCount(st.caption);
        document.getElementById('previewText').textContent = st.caption;
        App.toast('Symbols cleaned');
      };

      this.updateCount(st.caption);
    },

    updateCount(text) {
      const len = (text || '').length;
      document.getElementById('charCount').textContent = len + ' / ' + LIMIT;
      const status = document.getElementById('charStatus');
      status.className = len > LIMIT ? 'over' : len >= 450 ? 'warn' : 'ok';
      status.textContent = len > LIMIT ? 'Over limit by ' + (len - LIMIT) : 'Fits Threads';
    },

    async generate() {
      const st = this.state;
      const s = App.state;
      const product = s.products.find((p) => p.id === st.productId);
      if (!product) return App.toast('Pick a product first', true);

      const btn = document.getElementById('btnGenerate');
      btn.disabled = true;
      const oldLabel = btn.textContent;
      btn.textContent = '⏳ Generating...';

      try {
        let caption;
        if (st.mode === 'ai') {
          const hashtags = ThreadsContentService.getRandomHashtags(st.hashtagCategory, st.hashtagCount);
          caption = await ShopAI.generateCaption(product, st.styleId, hashtags, s.settings);
          App.toast('AI caption ready');
        } else {
          caption = ThreadsContentService.generateCaption(st.styleId, product, {
            category: st.hashtagCategory,
            hashtagCount: st.hashtagCount
          });
          App.toast('Caption spun 🎲');
        }
        st.caption = caption;
        App.rerender();
      } catch (err) {
        App.toast(err.message || 'Generation failed', true);
        btn.disabled = false;
        btn.textContent = oldLabel;
      }
    }
  };

  window.StudioView = StudioView;
})();
