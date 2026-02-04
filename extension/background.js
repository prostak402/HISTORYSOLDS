const PENDING_KEY = 'cs_profit_pending_history';

async function getPending() {
  const data = await chrome.storage.local.get(PENDING_KEY);
  return Array.isArray(data[PENDING_KEY]) ? data[PENDING_KEY] : [];
}

async function setPending(list) {
  await chrome.storage.local.set({ [PENDING_KEY]: list });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'CS_PROFIT_ADD') {
    getPending().then((list) => {
      const next = [...list, message.payload];
      return setPending(next).then(() => {
        sendResponse({ ok: true, count: next.length });
      });
    }).catch((error) => {
      sendResponse({ ok: false, error: error?.message || 'unknown' });
    });
    return true;
  }
});
