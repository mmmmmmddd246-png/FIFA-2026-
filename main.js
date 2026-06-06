// main.js — Bootstrap & orchestration
import state from './js/state.js';
import { getTheme, setTheme, getApiKey, setApiKey } from './js/storage.js';
import { showToast } from './js/ui/toast-view.js';
import { initCountdown } from './js/ui/countdown-view.js';
import { renderMatches } from './js/ui/match-list-view.js';
import { renderGroups } from './js/ui/groups-view.js';
import { renderFavorites } from './js/ui/favorites-view.js';
import { renderStats } from './js/ui/stats-view.js';
import { renderHistory } from './js/ui/history-view.js';
import { refreshAllData, startLivePolling, onLiveUpdate } from './js/live-service.js';

let activeTab = 'matches';

// ── Theme ──────────────────────────────────────────────────────────
async function initTheme() {
  const theme = await getTheme();
  document.documentElement.classList.toggle('light', theme === 'light');
  updateThemeBtn(theme);
}
function updateThemeBtn(theme) {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light');
  const theme = isLight ? 'light' : 'dark';
  setTheme(theme);
  updateThemeBtn(theme);
}

// ── Tab Navigation ─────────────────────────────────────────────────
export function switchTab(tab) {
  activeTab = tab;
  const content = document.getElementById('tab-content');
  if (!content) return;

  document.querySelectorAll('.nav-tab').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  content.innerHTML = `
    <div class="flex items-center justify-center py-16">
      <div class="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
    </div>`;

  setTimeout(() => {
    switch (tab) {
      case 'matches':   renderMatches(content);   break;
      case 'groups':    renderGroups(content);     break;
      case 'favorites': renderFavorites(content);  break;
      case 'stats':     renderStats(content);      break;
      case 'history':   renderHistory(content);    break;
    }
  }, 20);
}

// ── Setup Screen — إدخال مفتاح API ────────────────────────────────
function showSetupScreen(existingKey = '') {
  const content = document.getElementById('tab-content');
  if (!content) return;

  // إخفاء شريط التنقل أثناء الإعداد
  document.querySelector('header nav')?.classList.add('hidden');
  document.querySelector('nav[role="tablist"]')?.classList.add('hidden');
  document.getElementById('countdown')?.classList.add('hidden');

  content.innerHTML = `
    <div class="animate-fade-up flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="flex flex-col items-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-3xl mb-3">🏆</div>
          <h1 class="text-xl font-black text-white text-center">المونديال الشامل 2026</h1>
          <p class="text-xs text-slate-400 mt-1 text-center">بيانات حقيقية ومحدّثة لحظياً</p>
        </div>

        <!-- بطاقة الإعداد -->
        <div class="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <h2 class="text-sm font-bold text-white mb-1">🔑 مفتاح API-Football</h2>
          <p class="text-[11px] text-slate-400 mb-4 leading-relaxed">
            للحصول على بيانات حقيقية من API-Football، احصل على مفتاح مجاني من
            <span class="text-cyan-400">api-football.com</span>
            (100 طلب/يوم مجاناً)
          </p>

          <label class="block text-[11px] text-slate-400 mb-1.5" for="apiKeyInput">المفتاح (API Key)</label>
          <input
            id="apiKeyInput"
            type="password"
            value="${existingKey}"
            placeholder="أدخل مفتاحك هنا..."
            class="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-sm px-4 py-3 outline-none focus:border-cyan-400/60 focus:bg-white/[0.08] transition placeholder:text-slate-600 mb-3"
            dir="ltr"
            autocomplete="off"
            spellcheck="false"
          >
          <div class="flex items-center gap-2 mb-4">
            <input type="checkbox" id="showKey" class="rounded">
            <label for="showKey" class="text-[11px] text-slate-400 cursor-pointer">إظهار المفتاح</label>
          </div>

          <button id="connectBtn" class="w-full rounded-xl bg-cyan-400 text-slate-950 font-bold py-3.5 text-sm transition hover:bg-cyan-300 active:scale-[0.99] disabled:opacity-40" disabled>
            🔌 اتصال وتحميل البيانات
          </button>

          ${existingKey ? `
          <button id="clearKeyBtn" class="w-full mt-2 rounded-xl bg-white/[0.04] text-slate-400 py-2.5 text-xs transition hover:bg-white/[0.08]">
            🗑️ مسح المفتاح المحفوظ
          </button>` : ''}
        </div>

        <!-- تعليمات -->
        <div class="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
          <p class="text-[11px] font-bold text-cyan-400 mb-2">📋 كيف تحصل على المفتاح؟</p>
          <ol class="text-[10px] text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
            <li>اذهب إلى <span class="text-white">api-football.com</span></li>
            <li>اضغط "Get Free API Key"</li>
            <li>أنشئ حساباً مجانياً</li>
            <li>انسخ المفتاح والصقه هنا</li>
          </ol>
          <p class="text-[10px] text-slate-500 mt-2">الخطة المجانية: 100 طلب/يوم — كافية للمتابعة اليومية</p>
        </div>
      </div>
    </div>`;

  const input   = content.querySelector('#apiKeyInput');
  const btn     = content.querySelector('#connectBtn');
  const showCb  = content.querySelector('#showKey');
  const clearBtn = content.querySelector('#clearKeyBtn');

  // تفعيل زر الاتصال عند الكتابة
  input?.addEventListener('input', () => {
    btn.disabled = !input.value.trim();
  });
  if (existingKey) btn.disabled = false;

  showCb?.addEventListener('change', () => {
    input.type = showCb.checked ? 'text' : 'password';
  });

  btn?.addEventListener('click', () => connectWithKey(input.value.trim()));
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') connectWithKey(input.value.trim()); });

  clearBtn?.addEventListener('click', async () => {
    const { clearApiKey, clearAllCache } = await import('./js/data.js');
    await import('./js/storage.js').then(m => m.clearApiKey());
    await clearAllCache();
    state.apiKey = '';
    state.connected = false;
    showSetupScreen('');
  });
}

// ── الاتصال بالـ API ───────────────────────────────────────────────
async function connectWithKey(key) {
  if (!key) return;
  const content = document.getElementById('tab-content');
  const btn = content?.querySelector('#connectBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ جاري التحميل...'; }

  try {
    state.apiKey = key;
    await refreshAllData(false);
    await setApiKey(key);
    state.connected = true;

    // إظهار واجهة التطبيق الكاملة
    document.querySelector('header nav')?.classList.remove('hidden');
    document.querySelector('nav[role="tablist"]')?.classList.remove('hidden');
    document.getElementById('countdown')?.classList.remove('hidden');

    const countdown = document.getElementById('countdown');
    if (countdown) initCountdown(countdown);

    // بدء الـ polling الحي
    onLiveUpdate(() => {
      if (activeTab === 'matches') {
        const c = document.getElementById('tab-content');
        if (c) renderMatches(c);
      }
    });
    startLivePolling();

    showToast('✅ تم الاتصال بنجاح! البيانات محدّثة', 'success');
    switchTab('matches');

  } catch (e) {
    state.apiKey = '';
    state.connected = false;
    if (btn) { btn.disabled = false; btn.textContent = '🔌 اتصال وتحميل البيانات'; }

    let msg = 'تعذّر الاتصال — تحقق من المفتاح';
    if (e.message?.includes('401') || e.message?.toLowerCase().includes('token')) {
      msg = '❌ المفتاح غير صحيح أو منتهي الصلاحية';
    } else if (e.message?.includes('429') || e.message?.toLowerCase().includes('limit')) {
      msg = '⚠️ تجاوزت الحد اليومي (100 طلب/يوم) — حاول غداً';
    } else if (e.message?.includes('fetch') || e.message?.includes('network')) {
      msg = '🌐 تعذّر الاتصال بالإنترنت';
    }
    showToast(msg, 'error', 5000);
  }
}

// ── Init ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await initTheme();

  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // تحقق من مفتاح محفوظ
  const savedKey = await getApiKey();

  if (savedKey) {
    // إخفاء التنقل مؤقتاً حتى تنتهي عملية التحميل
    document.querySelector('header nav')?.classList.add('hidden');
    document.querySelector('nav[role="tablist"]')?.classList.add('hidden');
    document.getElementById('countdown')?.classList.add('hidden');

    const content = document.getElementById('tab-content');
    if (content) {
      content.innerHTML = `
        <div class="flex flex-col items-center justify-center py-24 gap-4">
          <div class="animate-spin w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
          <p class="text-sm text-slate-400">جاري تحميل بيانات البطولة...</p>
        </div>`;
    }

    try {
      state.apiKey = savedKey;
      await refreshAllData(false);
      state.connected = true;

      document.querySelector('header nav')?.classList.remove('hidden');
      document.querySelector('nav[role="tablist"]')?.classList.remove('hidden');
      document.getElementById('countdown')?.classList.remove('hidden');

      const countdown = document.getElementById('countdown');
      if (countdown) initCountdown(countdown);

      onLiveUpdate(() => {
        if (activeTab === 'matches') {
          const c = document.getElementById('tab-content');
          if (c) renderMatches(c);
        }
      });
      startLivePolling();
      switchTab('matches');

    } catch (e) {
      // المفتاح المحفوظ لم يعد يعمل — أعرض شاشة الإعداد
      showSetupScreen(savedKey);
    }
  } else {
    showSetupScreen('');
  }
});
