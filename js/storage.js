// js/storage.js — Storage helpers using miniappsAI.storage
const storage = () => window.miniappsAI?.storage;

export async function getFavorites() {
  try {
    const raw = await storage()?.getItem('favorites');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function setFavorites(ids) {
  await storage()?.setItem('favorites', JSON.stringify(ids));
}

export async function getTheme() {
  try {
    return (await storage()?.getItem('theme')) || 'dark';
  } catch { return 'dark'; }
}

export async function setTheme(theme) {
  await storage()?.setItem('theme', theme);
}

export async function getApiKey() {
  try {
    return (await storage()?.getItem('apif_key')) || '';
  } catch { return ''; }
}

export async function setApiKey(key) {
  await storage()?.setItem('apif_key', key.trim());
}

export async function clearApiKey() {
  try { await storage()?.removeItem('apif_key'); } catch {}
}
