// js/state.js — Shared application state
const state = {
  apiKey:    '',          // مفتاح API-Football
  connected: false,       // هل تم الاتصال بنجاح؟
  loading:   false,
  error:     null,

  // بيانات البطولة
  teams:     {},          // { id: { id, name, flag, logo, code } }
  fixtures:  [],          // مصفوفة المباريات المعيارية
  standings: {},          // { 'A': [...rows], 'B': [...] }
  stats:     null,

  // حالة التحديث الحي
  livePolling:  false,    // هل يعمل الـ polling؟
  lastFetch:    null,
  lastLiveFetch: null,
  liveMatchIds: new Set(),// معرفات المباريات الحية الحالية
};

export default state;
