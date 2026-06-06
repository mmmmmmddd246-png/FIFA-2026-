// UI: Match List — بيانات حية من API-Football
import state from '../state.js';
import { getFavorites } from '../storage.js';
import { fetchMatchStats, fetchMatchEvents } from '../data.js';
const t = (key, vals) => window.miniappI18n?.t(key, vals) ?? key;

let currentFilter = 'all';
let currentGroup  = 'all';

function getTeam(id) {
  return state.teams[id] || { name: '?', flag: '🏳️', logo: '', code: '???' };
}

function formatTime(iso) {
  if (!iso) return '--:--';
  try { return new Date(iso).toLocaleTimeString('ar-SA', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Riyadh' }); }
  catch { return '--:--'; }
}

function formatDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('ar-SA', { weekday:'short', month:'short', day:'numeric', timeZone:'Asia/Riyadh' }); }
  catch { return ''; }
}

function formatFullDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric', timeZone:'Asia/Riyadh' }); }
  catch { return ''; }
}

function statusBadge(match) {
  if (match.status === 'live') {
    const min = match.elapsed ? ` ${match.elapsed}'` : '';
    return `<span class="inline-flex items-center gap-1 bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
      <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block"></span>مباشر${min}</span>`;
  }
  if (match.status === 'finished') {
    const ht = match.statusShort === 'AET' ? ' (إ.إ)' : match.statusShort === 'PEN' ? ' (ر.ت)' : '';
    return `<span class="text-[10px] text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-full">انتهت${ht}</span>`;
  }
  return `<span class="text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">${formatTime(match.date)}</span>`;
}

function stageLabel(match) {
  if (match.stage === 'group') return `المجموعة ${match.group} · الجولة ${match.matchday}`;
  return match.label || {
    round32:'دور الـ32', round16:'دور الـ16',
    quarterFinal:'ربع النهائي', semiFinal:'نصف النهائي',
    thirdPlace:'مباراة المركز الثالث', final:'🏆 النهائي الكبير',
  }[match.stage] || match.apiRound || match.stage;
}

function teamDisplay(id, name, flag, logo, side) {
  const img = logo
    ? `<img src="${logo}" alt="${name}" class="w-10 h-10 sm:w-12 sm:h-12 object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
    : '';
  const emoji = `<span class="text-3xl sm:text-4xl leading-none" ${logo ? 'style="display:none"' : ''}>${flag || '🏳️'}</span>`;
  return `
    <div class="flex-1 flex flex-col items-center gap-1.5 min-w-0">
      ${img}${emoji}
      <span class="text-xs sm:text-sm font-semibold text-white truncate max-w-full text-center leading-tight">${name}</span>
    </div>`;
}

function matchCard(match, isFav) {
  const isGroup = match.stage === 'group';
  const home = isGroup ? getTeam(match.homeId) : { name: match.homeName, flag: match.homeFlag || '🏳️', logo: match.homeLogo || '' };
  const away = isGroup ? getTeam(match.awayId) : { name: match.awayName, flag: match.awayFlag || '🏳️', logo: match.awayLogo || '' };
  const showScore = match.status !== 'upcoming';
  const isFinal   = match.stage === 'final';
  const isLive    = match.status === 'live';

  const scoreBlock = showScore
    ? `<div class="flex flex-col items-center gap-0.5">
        <div class="flex items-center gap-2">
          <span class="text-2xl sm:text-3xl font-black ${isLive ? 'text-red-300' : 'text-white'} tabular-nums">${match.homeScore ?? 0}</span>
          <span class="text-slate-500 text-sm">:</span>
          <span class="text-2xl sm:text-3xl font-black ${isLive ? 'text-red-300' : 'text-white'} tabular-nums">${match.awayScore ?? 0}</span>
        </div>
        ${match.scorePEN ? `<span class="text-[9px] text-slate-500">ر.ت ${match.scorePEN.home}–${match.scorePEN.away}</span>` : ''}
       </div>`
    : `<div class="flex flex-col items-center gap-0.5">
        <span class="text-xs text-slate-500 font-medium">VS</span>
        <span class="text-[9px] text-slate-600">${formatDate(match.date)}</span>
       </div>`;

  return `
    <div class="match-card rounded-2xl border ${isFinal ? 'border-amber-400/30 bg-gradient-to-br from-amber-400/[0.06] to-transparent' : isLive ? 'border-red-400/20 bg-red-400/[0.02]' : isFav ? 'border-amber-400/20 bg-amber-400/[0.03]' : 'border-white/[0.06] bg-white/[0.03]'} hover:bg-white/[0.06] transition p-4 cursor-pointer" data-match-id="${match.id}">
      <div class="flex items-center justify-between mb-3">
        <span class="text-[10px] text-slate-500 truncate max-w-[65%]">${stageLabel(match)}</span>
        <div class="flex items-center gap-1.5">
          ${isFav ? '<span class="text-amber-400 text-xs">⭐</span>' : ''}
          ${statusBadge(match)}
        </div>
      </div>
      <div class="flex items-center justify-between gap-2">
        ${teamDisplay(match.homeId, home.name, home.flag, home.logo, 'home')}
        <div class="flex flex-col items-center gap-1 px-1 min-w-[72px]">
          ${scoreBlock}
        </div>
        ${teamDisplay(match.awayId, away.name, away.flag, away.logo, 'away')}
      </div>
      ${match.venue ? `<p class="text-[10px] text-slate-600 text-center mt-3 truncate">🏟️ ${match.venue}${match.venueCity ? ' · ' + match.venueCity : ''}</p>` : ''}
    </div>`;
}

async function matchDetail(match, container) {
  const isGroup = match.stage === 'group';
  const home = isGroup ? getTeam(match.homeId) : { name: match.homeName, flag: match.homeFlag || '🏳️', logo: match.homeLogo || '' };
  const away = isGroup ? getTeam(match.awayId) : { name: match.awayName, flag: match.awayFlag || '🏳️', logo: match.awayLogo || '' };
  const showScore = match.status !== 'upcoming';
  const scoreMain = showScore ? `${match.homeScore ?? 0}–${match.awayScore ?? 0}` : 'VS';

  function render(statsData, eventsData) {
    const homeStats = statsData.find(s => s.team?.id === match.homeId || s.team?.name === match.homeName)?.statistics || [];
    const awayStats = statsData.find(s => s.team?.id === match.awayId || s.team?.name === match.awayName)?.statistics || [];

    function getStat(arr, type) {
      const s = arr.find(x => x.type?.toLowerCase().includes(type.toLowerCase()));
      return s?.value ?? '—';
    }

    const statRows = [
      { label:'الاستحواذ', hKey:'Ball Possession', aKey:'Ball Possession' },
      { label:'التسديدات', hKey:'Total Shots', aKey:'Total Shots' },
      { label:'على المرمى', hKey:'Shots on Goal', aKey:'Shots on Goal' },
      { label:'التمريرات', hKey:'Total passes', aKey:'Total passes' },
      { label:'الركنيات', hKey:'Corner Kicks', aKey:'Corner Kicks' },
      { label:'الأخطاء', hKey:'Fouls', aKey:'Fouls' },
      { label:'الصفراء', hKey:'Yellow Cards', aKey:'Yellow Cards' },
      { label:'الحمراء', hKey:'Red Cards', aKey:'Red Cards' },
    ];

    const goals = eventsData.filter(e => e.type === 'Goal');
    const cards = eventsData.filter(e => e.type === 'Card');
    const subs  = eventsData.filter(e => e.type === 'subst');

    container.innerHTML = `
      <div class="animate-fade-in">
        <button id="backToMatches" class="mb-4 text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1.5 font-medium">
          <svg class="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          العودة للمباريات
        </button>

        <!-- بطاقة النتيجة -->
        <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden mb-4">
          <div class="bg-gradient-to-b from-cyan-400/[0.08] to-transparent px-5 py-7 text-center border-b border-white/[0.04]">
            <p class="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">${stageLabel(match)}</p>
            <div class="mt-1 mb-4">${statusBadge(match)}</div>
            <div class="flex items-center justify-between gap-4">
              <div class="flex-1 flex flex-col items-center gap-2">
                ${home.logo ? `<img src="${home.logo}" alt="${home.name}" class="w-14 h-14 object-contain">` : `<span class="text-5xl leading-none">${home.flag}</span>`}
                <span class="text-sm font-bold text-white text-center">${home.name}</span>
              </div>
              <div class="text-center px-2">
                <span class="text-4xl font-black text-white tabular-nums">${scoreMain}</span>
                ${match.scorePEN ? `<p class="text-[10px] text-slate-500 mt-1">ر.ت ${match.scorePEN.home}–${match.scorePEN.away}</p>` : ''}
                ${match.homeScoreHT != null ? `<p class="text-[10px] text-slate-500 mt-0.5">الشوط الأول: ${match.homeScoreHT}–${match.awayScoreHT}</p>` : ''}
              </div>
              <div class="flex-1 flex flex-col items-center gap-2">
                ${away.logo ? `<img src="${away.logo}" alt="${away.name}" class="w-14 h-14 object-contain">` : `<span class="text-5xl leading-none">${away.flag}</span>`}
                <span class="text-sm font-bold text-white text-center">${away.name}</span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-px bg-white/[0.04]">
            <div class="bg-white/[0.02] p-4 text-center">
              <span class="text-[10px] text-slate-500 block mb-1">🏟️ الملعب</span>
              <p class="text-xs text-white font-medium">${match.venue || '—'}</p>
              ${match.venueCity ? `<p class="text-[10px] text-slate-500 mt-0.5">${match.venueCity}</p>` : ''}
            </div>
            <div class="bg-white/[0.02] p-4 text-center">
              <span class="text-[10px] text-slate-500 block mb-1">🕐 الموعد</span>
              <p class="text-xs text-white font-medium">${formatTime(match.date)}</p>
              <p class="text-[10px] text-slate-500 mt-0.5">${formatFullDate(match.date)}</p>
            </div>
          </div>
        </div>

        <!-- الأهداف والأحداث -->
        ${goals.length > 0 ? `
        <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 mb-4">
          <h3 class="text-xs font-bold text-emerald-400 mb-3">⚽ الأهداف</h3>
          <div class="space-y-2">
            ${goals.map(e => {
              const isHome = e.team?.id === match.homeId || e.team?.name === match.homeName;
              return `
              <div class="flex items-center gap-2 ${isHome ? '' : 'flex-row-reverse'}">
                <span class="text-[11px] font-bold text-white w-8 text-center bg-emerald-400/10 rounded-lg py-0.5">${e.time?.elapsed}'</span>
                <div class="${isHome ? 'text-right' : 'text-left'} flex-1">
                  <p class="text-xs font-medium text-white">${e.player?.name || '—'}</p>
                  ${e.assist?.name ? `<p class="text-[10px] text-slate-500">مساعدة: ${e.assist.name}</p>` : ''}
                  ${e.detail ? `<p class="text-[10px] text-slate-600">${e.detail}</p>` : ''}
                </div>
                <span class="text-base">${isHome ? home.flag : away.flag}</span>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        <!-- إحصائيات المباراة -->
        ${homeStats.length > 0 ? `
        <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 mb-4">
          <h3 class="text-xs font-bold text-cyan-400 mb-4">📊 إحصائيات المباراة</h3>
          <div class="flex items-center justify-between mb-3 text-[11px] font-bold">
            <span class="text-white">${home.name}</span>
            <span class="text-slate-500">الإحصائية</span>
            <span class="text-white">${away.name}</span>
          </div>
          <div class="space-y-3">
            ${statRows.map(row => {
              const hv = getStat(homeStats, row.hKey);
              const av = getStat(awayStats, row.aKey);
              const hNum = parseFloat(hv) || 0;
              const aNum = parseFloat(av) || 0;
              const total = hNum + aNum;
              const hPct = total > 0 ? Math.round(hNum / total * 100) : 50;
              return `
              <div>
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="font-bold text-white w-12 text-right">${hv}</span>
                  <span class="text-slate-500 text-center flex-1">${row.label}</span>
                  <span class="font-bold text-white w-12 text-left">${av}</span>
                </div>
                <div class="flex h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
                  <div class="bg-cyan-400/70 rounded-full transition-all" style="width:${hPct}%"></div>
                  <div class="bg-amber-400/70 rounded-full transition-all flex-1"></div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>` : match.status !== 'upcoming' ? `
        <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 mb-4 text-center">
          <p class="text-[11px] text-slate-500">لا توجد إحصائيات تفصيلية لهذه المباراة</p>
        </div>` : ''}

        <!-- البطاقات والتبديلات -->
        ${cards.length > 0 ? `
        <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 mb-4">
          <h3 class="text-xs font-bold text-amber-400 mb-3">🟨 البطاقات</h3>
          <div class="space-y-1.5">
            ${cards.map(e => `
              <div class="flex items-center gap-2 text-xs">
                <span class="font-bold text-slate-400 w-8">${e.time?.elapsed}'</span>
                <span>${e.detail?.includes('Yellow') ? '🟨' : '🟥'}</span>
                <span class="text-white">${e.player?.name || '—'}</span>
                <span class="text-slate-500">${e.team?.name || ''}</span>
              </div>`).join('')}
          </div>
        </div>` : ''}
      </div>`;

    container.querySelector('#backToMatches')?.addEventListener('click', () => {
      // إعادة عرض قائمة المباريات
      renderMatches(container);
    });
  }

  // عرض هيكل أولي مع loading
  container.innerHTML = `
    <div class="animate-fade-in">
      <button id="backToMatchesLoading" class="mb-4 text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1.5 font-medium">
        <svg class="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        العودة للمباريات
      </button>
      <div class="flex items-center justify-center py-16">
        <div class="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    </div>`;
  container.querySelector('#backToMatchesLoading')?.addEventListener('click', () => renderMatches(container));

  // جلب الإحصائيات والأحداث
  let statsData = [], eventsData = [];
  if (match.status !== 'upcoming' && state.apiKey && match.id) {
    try {
      [statsData, eventsData] = await Promise.all([
        fetchMatchStats(match.id, state.apiKey),
        fetchMatchEvents(match.id, state.apiKey),
      ]);
    } catch {}
  }

  render(statsData, eventsData);
}

export async function renderMatches(container) {
  const favIds  = new Set(await getFavorites());
  const fixtures = state.fixtures;

  const statusFilters = [
    { key:'all',       label:'الكل' },
    { key:'live',      label:'🔴 مباشر' },
    { key:'today',     label:'اليوم' },
    { key:'upcoming',  label:'قادمة' },
    { key:'finished',  label:'انتهت' },
    { key:'favorites', label:'⭐ المفضلة' },
  ];
  const groupLetters = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  function filterMatches() {
    let list = [...fixtures];
    if (currentGroup === 'knockout') {
      list = list.filter(m => m.stage !== 'group');
    } else if (currentGroup !== 'all') {
      list = list.filter(m => m.group === currentGroup);
    }
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Riyadh' });
    if (currentFilter === 'today')     list = list.filter(m => new Date(m.date).toLocaleDateString('en-CA',{timeZone:'Asia/Riyadh'}) === todayStr);
    else if (currentFilter === 'upcoming')  list = list.filter(m => m.status === 'upcoming');
    else if (currentFilter === 'finished')  list = list.filter(m => m.status === 'finished');
    else if (currentFilter === 'live')      list = list.filter(m => m.status === 'live');
    else if (currentFilter === 'favorites') list = list.filter(m => favIds.has(m.homeId) || favIds.has(m.awayId));
    return list.sort((a, b) => a.timestamp - b.timestamp);
  }

  function render() {
    const matches = filterMatches();
    const byDate  = {};
    for (const m of matches) {
      const dk = new Date(m.date).toLocaleDateString('en-CA', { timeZone:'Asia/Riyadh' });
      if (!byDate[dk]) byDate[dk] = [];
      byDate[dk].push(m);
    }
    const liveCount = fixtures.filter(m => m.status === 'live').length;

    container.innerHTML = `
      <div class="animate-fade-in">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-white">جدول المباريات</h2>
          <div class="flex items-center gap-2">
            ${liveCount > 0 ? `<span class="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping inline-block"></span>${liveCount} مباشر</span>` : ''}
            <span class="text-[10px] text-slate-500">${fixtures.length} مباراة</span>
          </div>
        </div>

        <!-- فلاتر الحالة -->
        <div class="flex flex-wrap gap-1.5 mb-3">
          ${statusFilters.map(f => `
            <button data-filter="${f.key}" class="match-filter-btn px-3 py-1.5 rounded-full text-[11px] font-medium transition ${currentFilter === f.key ? 'bg-cyan-400 text-slate-950' : 'bg-white/[0.06] text-slate-400 hover:bg-white/10'}">
              ${f.label}
            </button>`).join('')}
        </div>

        <!-- فلاتر المجموعات -->
        <div class="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          <button data-grp="all" class="grp-filter-btn shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition ${currentGroup==='all'?'bg-white/15 text-white':'bg-white/[0.03] text-slate-500 hover:bg-white/[0.06]'}">الكل</button>
          ${groupLetters.map(g => `
            <button data-grp="${g}" class="grp-filter-btn shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition ${currentGroup===g?'bg-white/15 text-white':'bg-white/[0.03] text-slate-500 hover:bg-white/[0.06]'}">${g}</button>`).join('')}
          <button data-grp="knockout" class="grp-filter-btn shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition ${currentGroup==='knockout'?'bg-amber-400/20 text-amber-400':'bg-white/[0.03] text-slate-500 hover:bg-white/[0.06]'}">⚡ إقصاء</button>
        </div>

        ${matches.length === 0 ? `
          <div class="text-center py-16">
            <div class="text-4xl mb-3">📭</div>
            <p class="text-sm text-slate-400">لا توجد مباريات في هذا القسم</p>
          </div>` : `
          <div class="space-y-6">
            ${Object.entries(byDate).map(([dk, dayMatches]) => {
              const d = new Date(dk + 'T12:00:00');
              const label = d.toLocaleDateString('ar-SA', { weekday:'long', month:'long', day:'numeric' });
              return `
              <div>
                <h3 class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span class="h-px flex-1 bg-white/[0.06]"></span>${label}<span class="h-px flex-1 bg-white/[0.06]"></span>
                </h3>
                <div class="grid gap-3">
                  ${dayMatches.map(m => matchCard(m, favIds.has(m.homeId) || favIds.has(m.awayId))).join('')}
                </div>
              </div>`;
            }).join('')}
          </div>`}
      </div>`;

    container.querySelectorAll('.match-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => { currentFilter = btn.dataset.filter; render(); });
    });
    container.querySelectorAll('.grp-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => { currentGroup = btn.dataset.grp; render(); });
    });
    container.querySelectorAll('.match-card').forEach(card => {
      card.addEventListener('click', () => {
        const match = fixtures.find(m => m.id === +card.dataset.matchId);
        if (match) matchDetail(match, container);
      });
    });
  }

  render();
}
