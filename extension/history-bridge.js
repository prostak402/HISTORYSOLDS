const PENDING_KEY = 'cs_profit_pending_history';
const TARGET_FILE = 'cs_profit_calc_history_editable_v5.html';

function isTargetPage() {
  return window.location.pathname.endsWith(TARGET_FILE);
}

function sendToPage(payload) {
  window.postMessage({ type: 'CS_PROFIT_IMPORT', payload }, '*');
}

async function flushPending() {
  const data = await chrome.storage.local.get(PENDING_KEY);
  const list = Array.isArray(data[PENDING_KEY]) ? data[PENDING_KEY] : [];
  if (!list.length) return;
  list.forEach(sendToPage);
  await chrome.storage.local.set({ [PENDING_KEY]: [] });
}

if (isTargetPage()) {
  flushPending();
}
