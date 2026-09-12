const store = new Map();

/**
 * @param {string} key
 * @param {"ok"|"not_configured"|"error"} status
 * @param {unknown} data
 * @param {string} [error]
 */
export function setCacheEntry(key, status, data, error) {
  store.set(key, {
    status,
    data: data ?? null,
    error: error ?? null,
    updatedAt: new Date().toISOString()
  });
}

export function getCacheEntry(key) {
  return (
    store.get(key) || {
      status: "pending",
      data: null,
      error: null,
      updatedAt: null
    }
  );
}

export function getAllCacheEntries() {
  return Object.fromEntries(store.entries());
}
