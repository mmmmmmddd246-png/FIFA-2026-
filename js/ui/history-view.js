// UI: History & Records — أرشيف كامل لكأس العالم
import { WORLD_CUP_HISTORY, RECORDS } from '../data.js';
const t = (key, vals) => window.miniappI18n?.t(key, vals) ?? key;

// إحصاء عدد الألقاب لكل منتخب
function countTitles() {
  const counts = {};
  for (const wc of WORLD_CUP_HISTORY) {
    const w = wc.winner.replace(/ 🇦🇷|🇧🇷|🇩🇪|🇫🇷|🇮🇹|🇪🇸|🇺🇾|🏴󠁧󠁢󠁥󠁮󠁧󠁿|\s+$/g, '').trim();
    counts[wc.winner] = (counts[wc.winner] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export function renderHistory(container) {
  const titleCounts = countTitles();

  container.innerHTML = `
    <div class="animate-fade-in space-y-8">
      <div>
        <h2 class="text-lg font-bold text-white mb-1">${t('app.history.title')}</h2>
        <p class="text-[11px] text-slate-500">${t('app.history.subtitle')}</p>
      </div>

      <!-- بطاقة 2026 -->
      <div class="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.08] to-emerald-400/[0.04] p-5">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-3xl">🏆</span>
          <div>
            <p class="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">النسخة القادمة</p>
            <p class="text-lg font-black text-white">كأس العالم 2026</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="rounded-xl bg-white/[0.04] px-3 py-2">
            <p class="text-xs font-bold text-white">الولايات المتحدة 🇺🇸 · المكسيك 🇲🇽 · كندا 🇨🇦</p>
            <p class="text-[10px] text-slate-500 mt-0.5">3 دول مضيفة</p>
          </div>
          <div class="rounded-xl bg-white/[0.04] px-3 py-2">
            <p class="text-xs font-bold text-white">48 منتخباً</p>
            <p class="text-[10px] text-slate-500 mt-0.5">أكبر نسخة في التاريخ</p>
          </div>
          <div class="rounded-xl bg-white/[0.04] px-3 py-2">
            <p class="text-xs font-bold text-white">11 يونيو — 19 يوليو</p>
            <p class="text-[10px] text-slate-500 mt-0.5">39 يوماً</p>
          </div>
          <div class="rounded-xl bg-white/[0.04] px-3 py-2">
            <p class="text-xs font-bold text-white">104 مباراة</p>
            <p class="text-[10px] text-slate-500 mt-0.5">في 16 ملعب</p>
          </div>
        </div>
      </div>

      <!-- لوحة الأبطال -->
      <div>
        <h3 class="text-[11px] font-bold text-amber-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">🥇 لوحة الأبطال التاريخية</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${titleCounts.map(([winner, count], i) => `
            <div class="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 hover:bg-white/[0.05] transition">
              <span class="text-base font-black w-6 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-slate-500'}">${i + 1}</span>
              <span class="flex-1 text-sm font-medium text-white">${winner}</span>
              <div class="flex items-center gap-1">
                ${Array.from({length: count}).map(() => '<span class="text-xs">🏆</span>').join('')}
                <span class="text-xs font-bold text-amber-400 mr-1">${count}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- أرشيف كل النسخ -->
      <div>
        <h3 class="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">📅 جميع النسخ (1930 – 2022)</h3>
        <div class="space-y-2">
          ${WORLD_CUP_HISTORY.map((wc, i) => `
            <div class="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] transition px-3 py-3">
              <div class="w-12 h-10 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-600/10 flex items-center justify-center text-xs font-black text-amber-400 border border-amber-400/15 shrink-0">${wc.year}</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm font-bold text-white">${wc.winner}</span>
                </div>
                <div class="flex items-center gap-1 mt-0.5">
                  <span class="text-[10px] text-slate-500">الوصيف:</span>
                  <span class="text-[10px] text-slate-400">${wc.runnerUp}</span>
                </div>
              </div>
              <div class="text-left shrink-0">
                <span class="text-sm font-black text-cyan-400">${wc.score}</span>
                <p class="text-[10px] text-slate-600 mt-0.5">${wc.host}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- الأرقام القياسية -->
      <div>
        <h3 class="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">📊 أرقام قياسية</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${RECORDS.map(rec => `
            <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 hover:bg-white/[0.05] transition">
              <div class="text-xl mb-2">${rec.icon}</div>
              <h4 class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">${rec.title}</h4>
              <p class="text-sm font-medium text-white">${rec.value}</p>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}
