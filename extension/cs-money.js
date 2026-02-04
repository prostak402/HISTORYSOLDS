const BUTTON_CLASS = 'cs-profit-import-btn';

function parseNumber(text) {
  if (!text) return 0;
  const cleaned = text.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

function pickText(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent) return el.textContent.trim();
  }
  return '';
}

function getTransactionType() {
  const head = pickText([
    '[class*="TransactionHeader_head"] span',
    '[class*="TransactionHeader_head"]'
  ]);
  if (head.toLowerCase().includes('продажа')) return 'sell';
  return 'buy';
}

function extractPayload() {
  const name = pickText([
    '[class*="TransactionItem_name"]',
    '[class*="BaseCard_name"]',
    '[class*="BaseCard_title"]',
    '[class*="ItemName"]',
    '[class*="market-item"] [class*="name"]',
    '[class*="MarketItem_name"]',
    '[class*="DealItem_name"]',
    '[class*="ItemTitle"]',
    '[class*="ItemInfo_name"]',
    'h1',
    'h2'
  ]) || pickText(['img[alt]']);

  const dateText = pickText([
    '[class*="TransactionHeader_bottom"]',
    '[class*="TransactionHeader_bottom"] span',
    '[class*="TransactionHeader_date"]',
    '[class*="TransactionHeader_time"]',
    '[class*="date"]',
    '[class*="Date"]',
    'time'
  ]) || document.querySelector('time[datetime]')?.getAttribute('datetime') || '';

  const priceText = pickText([
    '[class*="BaseCard_price"] [class*="price_currency"]',
    '[class*="BaseCard_price"] span',
    '[class*="buy_currency"] span',
    '[class*="buy_currency"]'
  ]);

  const price = parseNumber(priceText);
  const type = getTransactionType();

  return {
    source: 'cs.money',
    name,
    price,
    type,
    date: dateText
  };
}

function ensureStyles() {
  if (document.getElementById('cs-profit-import-style')) return;
  const style = document.createElement('style');
  style.id = 'cs-profit-import-style';
  style.textContent = `
    .${BUTTON_CLASS} {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid rgba(122,162,255,.6);
      background: rgba(122,162,255,.15);
      color: #1e2b52;
      font-weight: 600;
      cursor: pointer;
      box-sizing: border-box;
      max-width: 100%;
      flex: 0 1 auto;
      white-space: nowrap;
    }
    .${BUTTON_CLASS}:hover { background: rgba(122,162,255,.25); }
    @media (max-width: 720px) {
      .${BUTTON_CLASS} {
        width: 100%;
        justify-content: center;
      }
    }
  `;
  document.head.appendChild(style);
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

function insertButton() {
  if (document.querySelector(`.${BUTTON_CLASS}`)) return;
  const container = document.querySelector('[class*="TransactionHeader_header"]')
    || document.querySelector('[class*="TransactionsMarketPage_detail"]');
  if (!container) return;
  ensureStyles();
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = BUTTON_CLASS;
  btn.textContent = 'Добавить в историю';
  btn.addEventListener('click', () => {
    const payload = extractPayload();
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
  container.prepend(btn);
}

const observer = new MutationObserver(() => insertButton());
observer.observe(document.documentElement, { childList: true, subtree: true });
insertButton();
