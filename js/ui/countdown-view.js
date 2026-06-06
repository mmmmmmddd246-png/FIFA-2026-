// UI: Countdown Timer — أقرب مباراة قادمة أو مباشرة
import state from '../state.js';
const t = (key, vals) => window.miniappI18n?.t(key, vals) ?? key;

let _intervalId = null;

function getTeamInfo(fx, side) {
  const isHome = side === 'home';
  const id     = isHome ? fx.homeId : fx.awayId;
  const name   = isHome ? fx.homeName : fx.awayName;
  const flag   = isHome ? (fx.homeFlag || '🏳️') : (fx.awayFlag || '🏳️');
  const logo   = isHome ? (fx.homeLogo || '') : (fx.awayLogo || '');
  const team   = state.teams[id];
  return {
    name:  team?.name || name,
    flag:  team?.flag || flag,
    logo:  team?.logo || logo,
  };
}

function teamDisplay(info) {
  if (info.logo) {
    return `<img src="${info.logo}" alt="${info.name}" class="w-10 h-10 sm:w-12 sm:h-12 object-contain mx-auto mb-1" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
            <span class="text-3xl sm:text-4xl leading-none block" style="display:none">${info.flag}</span>`;
  }
  return `<span class="text-3xl sm:text-4xl leading-none block">${info.flag}</span>`;
}

function stageLabel(fx) {
  if (fx.stage === 'group') return `المجموعة ${fx.group} · الجولة ${fx.matchday}`;
  return fx.label || fx.apiRound || fx.stage || '';
}

function findNextMatch() {
  const now = Date.now();
  return state.fixtures
    .filter(m => m.status === 'upcoming' && m.timestamp > now)
    .sort((a, b) => a.timestamp - b.timestamp)[0] || null;
}

function findLiveMatch() {
  return state.fixtures.find(m => m.status === 'live') || null;
}

export function initCountdown(container) {
  if (!container) return;
  if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }

  function render() {
    const live = findLiveMatch();
    const next = live || findNextMatch();

    if (!next) {
      container.innerHTML = `
        <div class="text-center py-3">
          <p class="text-slate-400 text-sm">🏆 كأس العالم 2026 — 11 يونيو إلى 19 يوليو</p>
        </div>`;
      return;
    }

    const home = getTeamInfo(next, 'home');
    const away = getTeamInfo(next, 'away');
    const matchDate = new Date(next.date);
    const dateLabel = matchDate.toLocaleDateString('ar-SA', { weekday:'long', month:'long', day:'numeric', timeZone:'Asia/Riyadh' });
    const timeLabel = matchDate.toLocaleTimeString('ar-SA', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Riyadh' });

    container.innerHTML = `
      <div class="text-center">
        <p class="text-[10px] uppercase tracking-[0.2em] ${live ? 'text-red-400' : 'text-cyan-400/80'} mb-1">
          ${live ? '🔴 مباشر الآن' : '⏳ المباراة القادمة'}
        </p>
        <p class="text-[10px] text-slate-500 mb-3">${stageLabel(next)}</p>
        <div class="flex items-center justify-center gap-4 mb-3">
          <div class="flex flex-col items-center gap-1 min-w-[64px]">
            ${teamDisplay(home)}
            <span class="text-xs font-bold text-white mt-1">${home.name}</span>
          </div>
          <div class="flex flex-col items-center">
            ${live
              ? `<span class="text-xl sm:text-2xl font-black ${next.elapsed?'text-red-300':'text-white'} tabular-nums">${next.homeScore??0} – ${next.awayScore??0}</span>
                 ${next.elapsed ? `<span class="text-[10px] text-red-400">${next.elapsed}'</span>` : ''}`
              : `<span class="text-sm text-slate-500 font-medium px-3 bg-white/[0.06] rounded-xl py-1.5">VS</span>`}
          </div>
          <div class="flex flex-col items-center gap-1 min-w-[64px]">
            ${teamDisplay(away)}
            <span class="text-xs font-bold text-white mt-1">${away.name}</span>
          </div>
        </div>
        ${!live ? '<div id="countdown-digits" class="flex items-center justify-center gap-2 sm:gap-3 mb-2"></div>' : ''}
        <p class="text-[10px] text-slate-500">
          🕐 ${timeLabel} · 📅 ${dateLabel}
          ${next.venue ? `<br>🏟️ ${next.venue}${next.venueCity ? ' · ' + next.venueCity : ''}` : ''}
        </p>
      </div>`;

    if (!live) startCountdown(next);
  }

  function startCountdown(match) {
    const digitsEl = document.getElementById('countdown-digits');
    if (!digitsEl) return;
    if (_intervalId) clearInterval(_intervalId);

    function update() {
      const diff = match.timestamp - Date.now();
      if (diff <= 0) {
        digitsEl.innerHTML = `<span class="text-sm font-bold text-emerald-400 animate-pulse">🟢 انطلقت المباراة!</span>`;
        clearInterval(_intervalId); _intervalId = null;
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const units = [
        { v:d, l:'يوم' }, { v:h, l:'ساعة' }, { v:m, l:'دقيقة' }, { v:s, l:'ثانية' },
      ];
      digitsEl.innerHTML = units.map((u, i) => `
        <div class="flex flex-col items-center">
          <span class="text-xl sm:text-2xl font-black tabular-nums text-white bg-white/[0.06] rounded-xl w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center border border-white/5">${String(u.v).padStart(2,'0')}</span>
          <span class="text-[9px] uppercase tracking-wider text-slate-500 mt-1">${u.l}</span>
        </div>${i<3?'<span class="text-base text-slate-600 font-bold self-start mt-2">:</span>':''}
      `).join('');
    }
    update();
    _intervalId = setInterval(update, 1000);
  }

  render();
}
