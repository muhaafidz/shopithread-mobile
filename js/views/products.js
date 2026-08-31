(function () {
  'use strict';

  const ProductsView = {
    render() {
      const s = App.state;
      if (s.products.length === 0) {
        return `
          <div class="pane-head"><h2>Products <span class="sub">${s.products.length} saved</span></h2></div>
          <div class="dropzone" id="dropzone">
            <div style="font-size:30px; margin-bottom:6px;">📥</div>
            <b>Import product CSV</b>
            <p style="font-size:12px; margin-top:4px;">Tap to pick a file exported from the desktop extension<br>(Product Name, Price, Commission, Sold, Affiliate Link...)</p>
          </div>
          <input type="file" id="csvFile" accept=".csv" style="display:none">
          <button class="btn btn-ghost btn-full" id="btnAddProduct">➕ Add Product Manually</button>`;
      }
      return `
        <div class="pane-head">
          <h2>Products <span class="sub">${s.products.length} saved · tap 🧵 to open in Studio</span></h2>
          <button class="icon-btn" id="btnAddProduct" title="Add product">➕</button>
        </div>
        <div class="row" style="margin-bottom:12px;">
          <button class="btn btn-ghost btn-sm" id="btnImportCsv" style="flex:1">📥 Import CSV</button>
          <button class="btn btn-ghost btn-sm" id="btnExportCsv" style="flex:1">📤 Export CSV</button>
        </div>
        <input type="file" id="csvFile" accept=".csv" style="display:none">
        <div class="list">
          ${s.products.map((p) => this.item(p)).join('')}
        </div>`;
    },

    item(p) {
      const img = p.image || p.cleanImgUrl || '';
      return `
        <div class="item" data-id="${App.esc(p.id)}">
          ${img ? `<img class="item-thumb" src="${App.esc(img)}" loading="lazy" onerror="this.style.visibility='hidden'">` : '<div class="item-thumb"></div>'}
          <div class="item-body">
            <b>${App.esc(p.title || p.rawTitle || 'Untitled')}</b>
            <div class="meta">
              <span class="price-tag">${App.esc(App.priceText(p))}</span>
              ${p.discount ? `<span>${App.esc(p.discount)}</span>` : ''}
              ${p.sold ? `<span>${App.esc(p.sold)}</span>` : ''}
            </div>
          </div>
          <div class="item-actions">
            <button class="icon-action act-studio" title="Open in Studio">🧵</button>
            <button class="icon-action act-copy" title="Copy link">🔗</button>
            <button class="icon-action danger act-del" title="Delete">🗑️</button>
          </div>
        </div>`;
    },

    bind() {
      const s = App.state;

      const fileInput = document.getElementById('csvFile');
      const dropzone = document.getElementById('dropzone');
      const openPicker = () => fileInput && fileInput.click();
      if (dropzone) {
        dropzone.addEventListener('click', openPicker);
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('drag');
          if (e.dataTransfer.files[0]) this.importFile(e.dataTransfer.files[0]);
        });
      }
      if (fileInput) fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) this.importFile(fileInput.files[0]);
        fileInput.value = '';
      });

      const importBtn = document.getElementById('btnImportCsv');
      if (importBtn) importBtn.onclick = openPicker;

      const exportBtn = document.getElementById('btnExportCsv');
      if (exportBtn) exportBtn.onclick = () => {
        try {
          window.CsvService.downloadCSV(s.products, 'shopithread_products.csv');
          App.toast('CSV exported');
        } catch (e) {
          App.toast(e.message, true);
        }
      };

      document.getElementById('btnAddProduct').onclick = () => this.openEditor(null);

      document.querySelectorAll('.item .act-studio').forEach((b) => {
        b.onclick = () => {
          StudioView.state.productId = b.closest('.item').dataset.id;
          App.switchTab('studio');
        };
      });
      document.querySelectorAll('.item .act-copy').forEach((b) => {
        b.onclick = async () => {
          const p = s.products.find((x) => x.id === b.closest('.item').dataset.id);
          const link = p && (p.shortLink || p.link);
          if (link && (await App.copyText(link))) App.toast('Affiliate link copied');
        };
      });
      document.querySelectorAll('.item .act-del').forEach((b) => {
        b.onclick = async () => {
          const id = b.closest('.item').dataset.id;
          if (!confirm('Delete this product?')) return;
          await ShopDB.delete('products', id);
          await App.refreshData();
          App.rerender();
          App.toast('Product deleted');
        };
      });
    },

    async importFile(file) {
      if (!file.name.toLowerCase().endsWith('.csv')) return App.toast('Please pick a .csv file', true);
      const text = await file.text();
      const parsed = window.CsvService.parseCSV(text);
      if (parsed.length === 0) return App.toast('CSV empty or unreadable', true);
      let added = 0;
      const seen = new Set(App.state.products.map((p) => (p.title || '').trim().toLowerCase()));
      for (const p of parsed) {
        const key = (p.title || '').trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        await ShopDB.put('products', { ...p, id: App.uid('prod'), createdAt: new Date().toISOString() });
        added++;
      }
      await App.refreshData();
      App.refreshAllViews();
      App.toast(added + ' products imported (' + (parsed.length - added) + ' duplicates skipped)');
    },

    openEditor(product) {
      const p = product || {};
      App.openModal(`
        <div class="modal-head">
          <h3>${product ? '✏️ Edit Product' : '➕ Add Product'}</h3>
          <button class="icon-btn" data-close>✕</button>
        </div>
        <label>Product Name *</label>
        <input type="text" id="peTitle" value="${App.esc(p.title || '')}" placeholder="Shopee product name">
        <div class="row">
          <div><label>Price (RM)</label><input type="text" id="pePrice" value="${App.esc(p.price || '')}" placeholder="89"></div>
          <div><label>Discount</label><input type="text" id="peDiscount" value="${App.esc(p.discount || '')}" placeholder="40%"></div>
        </div>
        <div class="row">
          <div><label>Rating</label><input type="text" id="peRating" value="${App.esc((p.rating || '').toString().replace(/[^\d.]/g, ''))}" placeholder="4.9"></div>
          <div><label>Sold</label><input type="text" id="peSold" value="${App.esc(p.sold || '')}" placeholder="1k+ terjual"></div>
        </div>
        <label>Affiliate Link *</label>
        <input type="url" id="peLink" value="${App.esc(p.shortLink || p.link || '')}" placeholder="https://s.shopee.com.my/...">
        <label>Photo URL</label>
        <input type="url" id="peImage" value="${App.esc(p.image || p.cleanImgUrl || '')}" placeholder="https://cf.shopee.com.my/file/...">
        <div class="row" style="margin-top:16px;">
          <button class="btn btn-ghost" data-close>Cancel</button>
          <button class="btn btn-primary" id="peSave">💾 Save</button>
        </div>
      `);

      document.getElementById('peSave').onclick = async () => {
        const title = document.getElementById('peTitle').value.trim();
        const link = document.getElementById('peLink').value.trim();
        if (!title || !link) return App.toast('Name and affiliate link are required', true);
        const row = {
          id: p.id || App.uid('prod'),
          title,
          rawTitle: title,
          price: document.getElementById('pePrice').value.trim() || '-',
          discount: document.getElementById('peDiscount').value.trim(),
          rating: document.getElementById('peRating').value.trim() || '4.9',
          sold: document.getElementById('peSold').value.trim() || '1k+ terjual',
          shortLink: link,
          image: document.getElementById('peImage').value.trim(),
          createdAt: p.createdAt || new Date().toISOString()
        };
        await ShopDB.put('products', row);
        await App.refreshData();
        App.closeModal();
        App.rerender();
        App.toast(product ? 'Product updated' : 'Product added');
      };
    }
  };

  window.ProductsView = ProductsView;
})();
