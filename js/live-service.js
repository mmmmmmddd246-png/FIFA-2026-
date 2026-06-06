// js/live-service.js — Live match polling (every 60s)
import state from './state.js';
import { fetchLiveFixtures, fetchAllFixtures, fetchStandings, buildTeamsFromFixtures, buildStandingsFromFixtures, computeTournamentStats } from './data.js';
import { getFavorites } from './storage.js';
import { showToast } from './ui/toast-view.js';

let _pollTimer = null;
let _onLiveUpdate = null;  // callback عند تحديث البيانات الحية

export function onLiveUpdate(cb) { _onLiveUpdate = cb; }

// ── بدء الـ polling ───────────────────────────────────────────────
export function startLivePolling() {
  if (_pollTimer) return;
  state.livePolling = true;
  _pollTimer = setInterval(pollLive, 60_000);
}

export function stopLivePolling() {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
  state.livePolling = false;
}

// ── تحديث المباريات الحية ─────────────────────────────────────────
async function pollLive() {
  if (!state.apiKey) return;
  try {
    const liveFixtures = await fetchLiveFixtures(state.apiKey);

    if (liveFixtures.length === 0) {
      // لا توجد مباريات حية — تحديث الحالة فقط
      const prevLive = [...state.liveMatchIds];
      if (prevLive.length > 0) {
        // المباريات انتهت — أعد جلب الجدول الكامل
        await refreshAllData(true);
      }
      state.liveMatchIds.clear();
      return;
    }

    // كشف الأهداف الجديدة
    const favIds = new Set(await getFavorites());
    for (const fx of liveFixtures) {
      const existing = state.fixtures.find(f => f.id === fx.id);
      if (!existing) continue;
      const prevH = existing.homeScore ?? 0;
      const prevA = existing.awayScore ?? 0;
      const newH  = fx.homeScore ?? 0;
      const newA  = fx.awayScore ?? 0;

      if (newH > prevH) {
        notifyGoal(fx.homeName, fx.homeFlag, newH, newA, fx, favIds);
      }
      if (newA > prevA) {
        notifyGoal(fx.awayName, fx.awayFlag, newA, newH, fx, favIds);
      }

      // تحديث المباراة في state
      Object.assign(existing, {
        homeScore:   fx.homeScore,
        awayScore:   fx.awayScore,
        status:      fx.status,
        statusShort: fx.statusShort,
        elapsed:     fx.elapsed,
      });
    }

    // تحديث مجموعة المعرفات الحية
    state.liveMatchIds = new Set(liveFixtures.map(f => f.id));

    if (_onLiveUpdate) _onLiveUpdate(liveFixtures);

  } catch (e) {
    console.warn('Live poll error:', e.message);
  }
}

function notifyGoal(teamName, flag, scorerGoals, opponentGoals, fx, favIds) {
  const isFav = favIds.has(fx.homeId) || favIds.has(fx.awayId);
  const msg = `${flag} هدف! ${teamName} — ${fx.homeName} ${fx.homeScore ?? 0}–${fx.awayScore ?? 0} ${fx.awayName}`;
  showToast(msg, isFav ? 'goal' : 'info', isFav ? 6000 : 4000);
}

// ── تحديث كامل للبيانات ───────────────────────────────────────────
export async function refreshAllData(forceRefresh = false) {
  if (!state.apiKey) return;
  try {
    const fixtures = await fetchAllFixtures(state.apiKey, forceRefresh);
    state.fixtures  = fixtures;
    state.teams     = buildTeamsFromFixtures(fixtures);

    // جلب ترتيب المجموعات من API
    try {
      const standings = await fetchStandings(state.apiKey, forceRefresh);
      if (standings && Object.keys(standings).length > 0) {
        state.standings = standings;
      } else {
        state.standings = buildStandingsFromFixtures(fixtures, state.teams);
      }
    } catch {
      state.standings = buildStandingsFromFixtures(fixtures, state.teams);
    }

    state.stats    = computeTournamentStats(fixtures, state.teams);
    state.lastFetch = Date.now();
    if (_onLiveUpdate) _onLiveUpdate([]);
  } catch (e) {
    throw e;
  }
}
