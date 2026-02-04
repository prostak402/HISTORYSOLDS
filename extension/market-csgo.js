const BTN_CLASS = 'cs-profit-row-btn';

function parseNumber(text) {
  if (!text) return 0;
  const cleaned = text.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

function ensureStyles() {
  if (document.getElementById('cs-profit-row-style')) return;
  const style = document.createElement('style');
  style.id = 'cs-profit-row-style';
  style.textContent = `
    .${BTN_CLASS} {
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid #7aa2ff;
      background: rgba(122,162,255,.15);
      color: #23305a;
      font-weight: 600;
      cursor: pointer;
    }
    .${BTN_CLASS}:hover { background: rgba(122,162,255,.25); }
  `;
  document.head.appendChild(style);
}

function extractFromRow(row) {
  const typeText = row.querySelector('.history-type span')?.textContent?.trim() || '';
  const type = typeText.toLowerCase().includes('продажа') ? 'sell' : 'buy';
  const name = row.querySelector('.item-name a')?.textContent?.trim()
    || row.querySelector('.item-info-right a')?.getAttribute('title')
    || row.querySelector('.item-info-right a')?.textContent?.trim()
    || '';
  const priceText = row.querySelector('.price span:last-child')?.textContent
    || row.querySelector('.price')?.textContent
    || '';
  const price = parseNumber(priceText);
  const date = row.querySelector('.date')?.textContent?.replace(/\s+/g, ' ').trim() || '';
  return { source: 'market.csgo.com', name, price, type, date };
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    right: '20px',
    bottom: '20px',
    zIndex: 9999,
    padding: '10px 14px',
    background: '#1f2b4a',
    color: '#fff',
    borderRadius: '10px',
    fontSize: '13px',
    boxShadow: '0 6px 18px rgba(0,0,0,.3)'
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function ensureButton(row) {
  if (row.querySelector(`.${BTN_CLASS}`)) return;
  const cell = row.querySelector('.mat-column-actions .button') || row.querySelector('td.mat-column-actions');
  if (!cell) return;
  ensureStyles();
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = BTN_CLASS;
  btn.textContent = 'В историю';
  btn.addEventListener('click', () => {
    const payload = extractFromRow(row);
    if (!payload.price) {
      showToast('Не удалось определить цену сделки.');
      return;
    }
    chrome.runtime.sendMessage({ type: 'CS_PROFIT_ADD', payload }, (resp) => {
      if (resp?.ok) {
        showToast('Сделка добавлена в очередь импорта.');
      } else {
        showToast('Ошибка импорта.');
      }
    });
  });
  cell.appendChild(btn);
}

function scanRows() {
  document.querySelectorAll('tr.mat-mdc-row, tr.cdk-row').forEach((row) => ensureButton(row));
}

const observer = new MutationObserver(scanRows);
observer.observe(document.documentElement, { childList: true, subtree: true });
scanRows();
