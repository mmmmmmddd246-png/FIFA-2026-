// UI: Groups & Standings — ترتيب المجموعات من API-Football
import state from '../state.js';
const t = (key, vals) => window.miniappI18n?.t(key, vals) ?? key;

const GROUP_COLORS = {
  A:'from-red-400/10', B:'from-orange-400/10', C:'from-amber-400/10',
  D:'from-yellow-400/10', E:'from-lime-400/10', F:'from-green-400/10',
  G:'from-emerald-400/10', H:'from-teal-400/10', I:'from-cyan-400/10',
  J:'from-sky-400/10', K:'from-blue-400/10', L:'from-violet-400/10',
};

function teamCell(row) {
  const logo = row.teamLogo
    ? `<img src="${row.teamLogo}" alt="${row.teamName}" class="w-6 h-6 object-contain shrink-0" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">`
    : '';
  const flag = `<span class="text-base leading-none shrink-0" ${row.teamLogo ? 'style="display:none"' : ''}>${row.teamFlag || '🏳️'}</span>`;
  return `<div class="flex items-center gap-2">${logo}${flag}<span class="text-sm font-medium text-white truncate max-w-[100px] sm:max-w-[160px]">${row.teamName}</span></div>`;
}

function groupTable(rows) {
  if (!rows?.length) return '<p class="text-xs text-slate-500 px-4 py-3 text-center">لا توجد بيانات بعد</p>';
  return `
    <div class="overflow-x-auto">
      <table class="w-full text-right min-w-[340px]" dir="rtl">
        <thead>
          <tr class="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/[0.05]">
            <th class="py-2 px-2 text-center w-7">#</th>
            <th class="py-2 px-2">المنتخب</th>
            <th class="py-2 px-1.5 text-center w-7" title="لعب">ل</th>
            <th class="py-2 px-1.5 text-center w-7" title="فاز">ف</th>
            <th class="py-2 px-1.5 text-center w-7" title="تعادل">ت</th>
            <th class="py-2 px-1.5 text-center w-7" title="خسر">خ</th>
            <th class="py-2 px-1.5 text-center w-7" title="له">+</th>
            <th class="py-2 px-1.5 text-center w-7" title="عليه">-</th>
            <th class="py-2 px-1.5 text-center w-8" title="فارق">±</th>
            <th class="py-2 px-2 text-center w-12">نقاط</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r, i) => {
            const qualified = i < 2;
            const gd = r.gd ?? (r.gf - r.ga);
            return `
              <tr class="border-t border-white/[0.04] ${qualified ? 'bg-emerald-400/[0.03]' : ''} hover:bg-white/[0.03] transition">
                <td class="py-2.5 px-2 text-center text-xs font-bold ${qualified ? 'text-emerald-400' : 'text-slate-500'}">${r.rank || i+1}</td>
                <td class="py-2.5 px-2">${teamCell(r)}</td>
                <td class="py-2.5 px-1.5 text-center text-xs text-slate-300 tabular-nums">${r.played}</td>
                <td class="py-2.5 px-1.5 text-center text-xs text-slate-300 tabular-nums">${r.won}</td>
                <td class="py-2.5 px-1.5 text-center text-xs text-slate-300 tabular-nums">${r.draw}</td>
                <td class="py-2.5 px-1.5 text-center text-xs text-slate-300 tabular-nums">${r.lost}</td>
                <td class="py-2.5 px-1.5 text-center text-xs text-slate-300 tabular-nums">${r.gf}</td>
                <td class="py-2.5 px-1.5 text-center text-xs text-slate-300 tabular-nums">${r.ga}</td>
                <td class="py-2.5 px-1.5 text-center text-xs font-medium tabular-nums ${gd>0?'text-emerald-400':gd<0?'text-red-400':'text-slate-400'}">${gd>0?'+':''}${gd}</td>
                <td class="py-2.5 px-2 text-center text-sm font-black text-white tabular-nums">${r.pts}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function groupMatches(gid) {
  const fx = state.fixtures.filter(f => f.stage === 'group' && f.group === gid)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (!fx.length) return '';

  return `
    <div class="border-t border-white/[0.04] px-3 py-3">
      <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-2">مباريات المجموعة</p>
      <div class="space-y-1.5">
        ${fx.map(f => {
          const home = state.teams[f.homeId] || { name: f.homeName, flag: f.homeFlag || '🏳️', logo: f.homeLogo || '' };
          const away = state.teams[f.awayId] || { name: f.awayName, flag: f.awayFlag || '🏳️', logo: f.awayLogo || '' };
          const d = new Date(f.date);
          const dateStr = d.toLocaleDateString('ar-SA', { month:'short', day:'numeric', timeZone:'Asia/Riyadh' });
          const timeStr = d.toLocaleTimeString('ar-SA', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Riyadh' });
          const isLive = f.status === 'live';
          const scoreBlock = f.status !== 'upcoming'
            ? `<span class="text-xs font-black ${isLive?'text-red-400':'text-white'}">${f.homeScore??0}–${f.awayScore??0}</span>`
            : `<span class="text-[10px] text-slate-500">${timeStr}</span>`;

          const homeLogo = home.logo ? `<img src="${home.logo}" class="w-5 h-5 object-contain" onerror="this.style.display='none'">` : '';
          const awayLogo = away.logo ? `<img src="${away.logo}" class="w-5 h-5 object-contain" onerror="this.style.display='none'">` : '';

          return `
            <div class="flex items-center gap-2 rounded-lg ${isLive?'bg-red-400/[0.04] border border-red-400/10':'bg-white/[0.02]'} px-2.5 py-2">
              <span class="text-[10px] text-slate-500 w-12 shrink-0 text-center">${isLive?`<span class="text-red-400">${f.elapsed}'</span>`:dateStr}</span>
              <div class="flex-1 flex items-center justify-center gap-1.5">
                ${homeLogo}<span class="text-sm leading-none">${home.flag||'🏳️'}</span>
                <span class="text-xs text-white font-medium truncate max-w-[60px]">${home.name}</span>
                ${scoreBlock}
                <span class="text-xs text-white font-medium truncate max-w-[60px]">${away.name}</span>
                <span class="text-sm leading-none">${away.flag||'🏳️'}</span>${awayLogo}
              </div>
              <span class="text-[10px] text-slate-600 w-12 text-center shrink-0">${f.status==='upcoming'?dateStr:''}</span>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

export function renderGroups(container) {
  const keys = Object.keys(state.standings).sort();
  let expandedGroup = keys.length > 0 ? keys[0] : null;

  if (keys.length === 0) {
    container.innerHTML = `
      <div class="animate-fade-in flex flex-col items-center justify-center py-16 gap-3">
        <div class="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-2xl">📊</div>
        <p class="text-sm text-slate-400">لا توجد بيانات ترتيب بعد</p>
        <p class="text-xs text-slate-500">ستظهر هنا عند انطلاق البطولة</p>
      </div>`;
    return;
  }

  function render() {
    container.innerHTML = `
      <div class="animate-fade-in">
        <div class="flex items-center justify-between mb-1">
          <h2 class="text-lg font-bold text-white">ترتيب المجموعات</h2>
          <span class="text-[10px] text-slate-500">${keys.length} مجموعة</span>
        </div>
        <p class="text-[11px] text-slate-500 mb-4">المراكز 1 و2 يتأهلان + أفضل 8 ثالثين</p>

        <!-- شبكة المجموعات -->
        <div class="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-5">
          ${keys.map(gid => {
            const rows = state.standings[gid] || [];
            const isActive = expandedGroup === gid;
            return `
              <button data-grp="${gid}" class="grp-card rounded-xl border ${isActive?'border-cyan-400/40 bg-cyan-400/[0.08]':'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]'} p-2 text-center transition">
                <div class="text-xs font-black ${isActive?'text-cyan-400':'text-slate-400'} mb-1.5">${gid}</div>
                <div class="flex flex-col gap-0.5 items-center">
                  ${rows.slice(0,4).map(r => {
                    const logo = r.teamLogo
                      ? `<img src="${r.teamLogo}" class="w-5 h-5 object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none">${r.teamFlag||'🏳️'}</span>`
                      : `<span class="text-sm leading-none">${r.teamFlag||'🏳️'}</span>`;
                    return `<div class="flex items-center justify-center">${logo}</div>`;
                  }).join('')}
                </div>
              </button>`;
          }).join('')}
        </div>

        <!-- تفاصيل المجموعة المختارة -->
        ${expandedGroup ? `
        <div class="rounded-2xl border border-cyan-400/20 bg-white/[0.02] overflow-hidden animate-fade-in">
          <div class="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] bg-gradient-to-l ${GROUP_COLORS[expandedGroup]||'from-cyan-400/10'} to-transparent">
            <div class="w-9 h-9 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-sm font-black text-cyan-400">${expandedGroup}</div>
            <div>
              <p class="text-sm font-bold text-white">المجموعة ${expandedGroup}</p>
              <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                ${(state.standings[expandedGroup]||[]).map(r => {
                  if (r.teamLogo) return `<img src="${r.teamLogo}" class="w-5 h-5 object-contain" onerror="this.style.display='none'">`;
                  return `<span class="text-base leading-none">${r.teamFlag||'🏳️'}</span>`;
                }).join('')}
              </div>
            </div>
          </div>
          ${groupTable(state.standings[expandedGroup])}
          ${groupMatches(expandedGroup)}
          <div class="px-4 py-2.5 border-t border-white/[0.04] bg-emerald-400/[0.02]">
            <p class="text-[10px] text-emerald-400">✅ المراكز 1 و2 يتأهلان مباشرة · المركز 3 قد يتأهل كأفضل ثالث</p>
          </div>
        </div>` : ''}
      </div>`;

    container.querySelectorAll('.grp-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const gid = btn.dataset.grp;
        expandedGroup = expandedGroup === gid ? null : gid;
        render();
      });
    });
  }

  render();
}
