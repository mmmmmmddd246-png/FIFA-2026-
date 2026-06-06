// UI: Tournament Statistics
import state from '../state.js';
const t = (key, vals) => window.miniappI18n?.t(key, vals) ?? key;

function getTeam(id) {
  return state.teams[id] || { name: '?', flag: '🏳️', logo: '' };
}

function statCard(icon, label, value, sub) {
  return `
    <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-center hover:bg-white/[0.05] transition">
      <div class="text-2xl mb-2">${icon}</div>
      <div class="text-2xl font-black text-white tabular-nums">${value}</div>
      <div class="text-[11px] text-slate-400 mt-1">${label}</div>
      ${sub ? `<div class="text-[10px] text-slate-500 mt-0.5">${sub}</div>` : ''}
    </div>`;
}

export function renderStats(container) {
  const total    = state.fixtures.length;
  const group    = state.fixtures.filter(f => f.stage === 'group').length;
  const knockout = state.fixtures.filter(f => f.stage !== 'group').length;
  const finished = state.fixtures.filter(f => f.status === 'finished').length;
  const live     = state.fixtures.filter(f => f.status === 'live').length;
  const upcoming = state.fixtures.filter(f => f.status === 'upcoming').length;

  const stats = state.stats;
  const bestAttack  = stats?.bestAttackId  ? getTeam(stats.bestAttackId)  : null;
  const bestDefense = stats?.bestDefenseId ? getTeam(stats.bestDefenseId) : null;

  // استخراج المجموعات من standings
  const groupKeys = Object.keys(state.standings).sort();

  // إحصاء الفرق حسب المجموعة
  const teamsPerGroup = groupKeys.map(gid => ({
    gid,
    rows: state.standings[gid] || [],
  }));

  container.innerHTML = `
    <div class="animate-fade-in space-y-7">
      <h2 class="text-lg font-bold text-white">إحصائيات البطولة</h2>

      <!-- حالة المباريات -->
      <div>
        <h3 class="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-3">📊 حالة المباريات</h3>
        <div class="grid grid-cols-3 gap-2">
          <div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
            <div class="text-xl font-black text-emerald-400">${finished}</div>
            <div class="text-[10px] text-slate-500 mt-0.5">انتهت</div>
          </div>
          <div class="rounded-xl border ${live>0?'border-red-400/30 bg-red-400/[0.04]':'border-white/[0.06] bg-white/[0.03]'} p-3 text-center">
            <div class="text-xl font-black ${live>0?'text-red-400 animate-pulse':'text-slate-500'}">${live}</div>
            <div class="text-[10px] text-slate-500 mt-0.5">مباشر</div>
          </div>
          <div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
            <div class="text-xl font-black text-cyan-400">${upcoming}</div>
            <div class="text-[10px] text-slate-500 mt-0.5">قادمة</div>
          </div>
        </div>
      </div>

      <!-- البطولة بالأرقام -->
      <div>
        <h3 class="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-3">🏆 البطولة بالأرقام</h3>
        <div class="grid grid-cols-2 gap-3">
          ${statCard('🌍', 'عدد المنتخبات', Object.keys(state.teams).length || 48, '12 مجموعة × 4 فرق')}
          ${statCard('⚽', 'إجمالي المباريات', total || 104, `${group} مجموعات + ${knockout} إقصاء`)}
          ${statCard('🏟️', 'عدد الملاعب', 16, 'في 3 دول مضيفة')}
          ${statCard('📅', 'مدة البطولة', '39 يوماً', '11 يونيو – 19 يوليو 2026')}
          ${statCard('🇺🇸', 'ملاعب USA', 11, 'نيويورك · LA · دالاس · ميامي...')}
          ${statCard('🇲🇽🇨🇦', 'MEX + CAN', '5', 'أزتيكا · أكرون · BBVA · فانكوفر · تورنتو')}
        </div>
      </div>

      <!-- إحصائيات الأهداف -->
      ${stats && finished > 0 ? `
      <div>
        <h3 class="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-3">⚽ إحصائيات الأهداف</h3>
        <div class="grid grid-cols-2 gap-3">
          ${statCard('⚽', 'إجمالي الأهداف', stats.totalGoals, `في ${finished} مباراة`)}
          ${statCard('📈', 'متوسط الأهداف', stats.avgGoals.toFixed(1), 'هدف لكل مباراة')}
          ${bestAttack ? `
          <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 flex items-center gap-3 col-span-2">
            ${bestAttack.logo ? `<img src="${bestAttack.logo}" class="w-10 h-10 object-contain">` : `<span class="text-3xl">${bestAttack.flag||'🏳️'}</span>`}
            <div>
              <p class="text-[10px] text-emerald-400 font-bold uppercase">أفضل هجوم</p>
              <p class="text-sm font-bold text-white">${bestAttack.name}</p>
              <p class="text-xs text-slate-400">${stats.bestAttackGoals} أهداف</p>
            </div>
          </div>` : ''}
          ${bestDefense ? `
          <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 flex items-center gap-3 col-span-2">
            ${bestDefense.logo ? `<img src="${bestDefense.logo}" class="w-10 h-10 object-contain">` : `<span class="text-3xl">${bestDefense.flag||'🏳️'}</span>`}
            <div>
              <p class="text-[10px] text-cyan-400 font-bold uppercase">أفضل دفاع</p>
              <p class="text-sm font-bold text-white">${bestDefense.name}</p>
              <p class="text-xs text-slate-400">${stats.bestDefenseConceded} أهداف استقبل</p>
            </div>
          </div>` : ''}
        </div>
      </div>` : ''}

      <!-- المجموعات مع الفرق -->
      ${groupKeys.length > 0 ? `
      <div>
        <h3 class="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-3">📋 المجموعات (${groupKeys.length})</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${teamsPerGroup.map(({ gid, rows }) => `
            <div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p class="text-xs font-bold text-cyan-400 mb-2">المجموعة ${gid}</p>
              <div class="grid grid-cols-2 gap-1">
                ${rows.map(r => `
                  <div class="flex items-center gap-1.5">
                    ${r.teamLogo ? `<img src="${r.teamLogo}" class="w-5 h-5 object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none" class="text-base leading-none">${r.teamFlag||'🏳️'}</span>` : `<span class="text-base leading-none">${r.teamFlag||'🏳️'}</span>`}
                    <span class="text-xs text-slate-300 truncate">${r.teamName}</span>
                  </div>`).join('')}
              </div>
            </div>`).join('')}
        </div>
      </div>` : `
      <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-center">
        <p class="text-sm text-slate-400">بيانات المجموعات ستظهر هنا عند انطلاق البطولة</p>
      </div>`}

      <!-- الملاعب الرسمية -->
      <div>
        <h3 class="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-3">🏟️ الملاعب الرسمية (16 ملعباً)</h3>
        <div class="space-y-1.5">
          ${[
            { name:'MetLife Stadium',         city:'نيويورك / نيوجيرسي', c:'🇺🇸', cap:82500 },
            { name:'Rose Bowl',               city:'لوس أنجلوس',          c:'🇺🇸', cap:92542 },
            { name:'SoFi Stadium',            city:'لوس أنجلوس',          c:'🇺🇸', cap:70240 },
            { name:'AT&T Stadium',            city:'دالاس / آرلينغتون',   c:'🇺🇸', cap:80000 },
            { name:'Hard Rock Stadium',       city:'ميامي',               c:'🇺🇸', cap:65326 },
            { name:'Lumen Field',             city:'سياتل',               c:'🇺🇸', cap:68740 },
            { name:"Levi's Stadium",          city:'سان فرانسيسكو',       c:'🇺🇸', cap:68500 },
            { name:'Arrowhead Stadium',       city:'كانساس سيتي',         c:'🇺🇸', cap:76416 },
            { name:'Gillette Stadium',        city:'بوسطن / فوكسبورو',    c:'🇺🇸', cap:65878 },
            { name:'Lincoln Financial Field', city:'فيلادلفيا',           c:'🇺🇸', cap:69176 },
            { name:'NRG Stadium',             city:'هيوستن',              c:'🇺🇸', cap:72220 },
            { name:'Estadio Azteca',          city:'مكسيكو سيتي',         c:'🇲🇽', cap:87523 },
            { name:'Estadio Akron',           city:'غوادالاخارا',          c:'🇲🇽', cap:49850 },
            { name:'Estadio BBVA',            city:'مونتيري',             c:'🇲🇽', cap:51348 },
            { name:'BC Place',               city:'فانكوفر',              c:'🇨🇦', cap:54500 },
            { name:'BMO Field',              city:'تورنتو',               c:'🇨🇦', cap:45736 },
          ].map(v => `
            <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition">
              <div class="flex items-center gap-2.5">
                <span class="text-base">${v.c}</span>
                <div>
                  <p class="text-xs font-medium text-white">${v.name}</p>
                  <p class="text-[10px] text-slate-500">${v.city}</p>
                </div>
              </div>
              <span class="text-xs text-slate-400 font-medium tabular-nums shrink-0">${v.cap.toLocaleString('ar')} 🪑</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}
