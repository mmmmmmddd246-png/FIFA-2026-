// UI: Favorites — اختيار المنتخبات المفضلة
import state from '../state.js';
import { getFavorites, setFavorites } from '../storage.js';
import { showToast } from './toast-view.js';
const t = (key, vals) => window.miniappI18n?.t(key, vals) ?? key;

export async function renderFavorites(container) {
  let selected = new Set(await getFavorites());

  // بناء قائمة المجموعات من standings
  const groupKeys = Object.keys(state.standings).sort();

  function render() {
    const totalSelected = selected.size;

    container.innerHTML = `
      <div class="animate-fade-in">
        <div class="text-center mb-5">
          <h2 class="text-lg font-bold text-white mb-1">اختر منتخباتك المفضلة</h2>
          <p class="text-[11px] text-slate-500">ستصلك إشعارات عند تسجيل أهدافهم</p>
        </div>

        ${totalSelected > 0 ? `
        <div class="mb-4 px-1">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs text-slate-400">المحددة</span>
            <span class="text-xs font-bold text-cyan-400">${totalSelected} منتخب</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${[...selected].map(id => {
              const tm = state.teams[id];
              if (!tm) return '';
              const logo = tm.logo ? `<img src="${tm.logo}" class="w-4 h-4 object-contain" onerror="this.style.display='none'">` : '';
              return `<span class="inline-flex items-center gap-1 bg-cyan-400/10 border border-cyan-400/20 rounded-lg px-2 py-1 text-xs text-cyan-400">
                ${logo}<span>${tm.flag||'🏳️'}</span> ${tm.name}
                <button class="deselect-btn ml-1 text-cyan-400/60 hover:text-red-400 transition" data-id="${id}" aria-label="إزالة ${tm.name}">✕</button>
              </span>`;
            }).join('')}
          </div>
        </div>` : ''}

        ${groupKeys.length > 0 ? `
        <div class="space-y-4 mb-6">
          ${groupKeys.map(gid => {
            const rows = state.standings[gid] || [];
            return `
              <div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                <h3 class="text-xs font-bold text-cyan-400 mb-2.5 flex items-center gap-2">
                  <span class="w-6 h-6 rounded-lg bg-cyan-400/10 flex items-center justify-center text-xs font-black">${gid}</span>
                  المجموعة ${gid}
                </h3>
                <div class="grid grid-cols-2 gap-2">
                  ${rows.map(row => {
                    const id = row.teamId;
                    const tm = state.teams[id] || { name: row.teamName, flag: row.teamFlag || '🏳️', logo: row.teamLogo || '' };
                    const isSel = selected.has(id);
                    const logoEl = tm.logo ? `<img src="${tm.logo}" class="w-6 h-6 object-contain shrink-0" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="text-lg leading-none shrink-0" style="display:none">${tm.flag||'🏳️'}</span>` : `<span class="text-lg leading-none shrink-0">${tm.flag||'🏳️'}</span>`;
                    return `
                      <button data-team-id="${id}" class="fav-team-btn flex items-center gap-2 px-3 py-2.5 rounded-xl border transition text-right ${isSel ? 'border-cyan-400/40 bg-cyan-400/10 text-white' : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:bg-white/[0.05]'}">
                        ${logoEl}
                        <span class="text-xs font-medium truncate flex-1">${tm.name}</span>
                        ${isSel ? '<span class="text-cyan-400 text-xs shrink-0">✓</span>' : ''}
                      </button>`;
                  }).join('')}
                </div>
              </div>`;
          }).join('')}
        </div>` : `
        <div class="text-center py-12 text-slate-500 text-sm mb-6">
          <p class="text-2xl mb-2">⏳</p>
          <p>بيانات المنتخبات ستظهر عند انطلاق البطولة</p>
        </div>`}

        <!-- زر الحفظ -->
        <div class="sticky bottom-0 pt-4 pb-2" style="background:linear-gradient(to top,var(--bg) 60%,transparent)">
          <button id="saveFavBtn" class="w-full rounded-2xl bg-cyan-400 text-slate-950 font-bold py-3.5 transition hover:bg-cyan-300 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed" ${totalSelected === 0 ? 'disabled' : ''}>
            ${totalSelected > 0 ? `💾 حفظ المفضلة (${totalSelected} منتخب)` : 'اختر منتخباً على الأقل'}
          </button>
        </div>
      </div>`;

    container.querySelectorAll('.fav-team-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = +btn.dataset.teamId;
        if (selected.has(id)) selected.delete(id); else selected.add(id);
        render();
      });
    });

    container.querySelectorAll('.deselect-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        selected.delete(+btn.dataset.id);
        render();
      });
    });

    container.querySelector('#saveFavBtn')?.addEventListener('click', async () => {
      if (selected.size === 0) { showToast('اختر منتخباً واحداً على الأقل', 'warning'); return; }
      await setFavorites([...selected]);
      showToast('✅ تم حفظ المفضلة! ستصلك إشعارات عند تسجيل أهدافهم', 'success', 4000);
    });
  }

  render();
}
