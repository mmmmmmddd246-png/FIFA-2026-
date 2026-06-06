// js/data.js — API-Football v3 live data + smart cache
// League: FIFA World Cup 2026 — League ID 1, Season 2026

export const WC_LEAGUE_ID = 1;
export const WC_SEASON    = 2026;
const BASE = 'https://v3.football.api-sports.io';

// ── أعلام المنتخبات ──────────────────────────────────────────────
export const FLAG_MAP = {
  'Albania':'🇦🇱','Algeria':'🇩🇿','Angola':'🇦🇴','Argentina':'🇦🇷','Australia':'🇦🇺',
  'Austria':'🇦🇹','Belgium':'🇧🇪','Bolivia':'🇧🇴','Brazil':'🇧🇷','Burkina Faso':'🇧🇫',
  'Cameroon':'🇨🇲','Canada':'🇨🇦','Chile':'🇨🇱','China':'🇨🇳','Colombia':'🇨🇴',
  'Costa Rica':'🇨🇷','Croatia':'🇭🇷','Czechia':'🇨🇿','Denmark':'🇩🇰','DR Congo':'🇨🇩',
  'Ecuador':'🇪🇨','Egypt':'🇪🇬','El Salvador':'🇸🇻','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','France':'🇫🇷',
  'Germany':'🇩🇪','Ghana':'🇬🇭','Greece':'🇬🇷','Honduras':'🇭🇳','Hungary':'🇭🇺',
  'Iceland':'🇮🇸','Indonesia':'🇮🇩','Iran':'🇮🇷','Iraq':'🇮🇶','Ireland':'🇮🇪',
  'Italy':'🇮🇹','Ivory Coast':'🇨🇮','Jamaica':'🇯🇲','Japan':'🇯🇵','Jordan':'🇯🇴',
  'South Korea':'🇰🇷','Kuwait':'🇰🇼','Lebanon':'🇱🇧','Mexico':'🇲🇽','Morocco':'🇲🇦',
  'Netherlands':'🇳🇱','New Zealand':'🇳🇿','Nigeria':'🇳🇬','Norway':'🇳🇴','Panama':'🇵🇦',
  'Paraguay':'🇵🇾','Peru':'🇵🇪','Philippines':'🇵🇭','Poland':'🇵🇱','Portugal':'🇵🇹',
  'Qatar':'🇶🇦','Romania':'🇷🇴','Saudi Arabia':'🇸🇦','Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Senegal':'🇸🇳',
  'Serbia':'🇷🇸','Slovakia':'🇸🇰','Slovenia':'🇸🇮','South Africa':'🇿🇦','Spain':'🇪🇸',
  'Sweden':'🇸🇪','Switzerland':'🇨🇭','Tanzania':'🇹🇿','Thailand':'🇹🇭','Tunisia':'🇹🇳',
  'Turkey':'🇹🇷','UAE':'🇦🇪','Ukraine':'🇺🇦','Uruguay':'🇺🇾','USA':'🇺🇸',
  'Venezuela':'🇻🇪','Wales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿','Uzbekistan':'🇺🇿','Palestine':'🇵🇸',
  'Trinidad and Tobago':'🇹🇹','Cuba':'🇨🇺','Guatemala':'🇬🇹','Comoros':'🇰🇲',
  'New Caledonia':'🇳🇨','Bahrain':'🇧🇭','Oman':'🇴🇲','Mali':'🇲🇱','Guinea':'🇬🇳',
};

export function getFlag(name) {
  if (!name) return '🏳️';
  for (const [k, f] of Object.entries(FLAG_MAP)) {
    if (name.toLowerCase() === k.toLowerCase()) return f;
  }
  for (const [k, f] of Object.entries(FLAG_MAP)) {
    if (name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase())) return f;
  }
  return '🏳️';
}

// ── مفاتيح التخزين المؤقت ────────────────────────────────────────
const CACHE = {
  FIXTURES:  'apif_fixtures_2026',
  STANDINGS: 'apif_standings_2026',
  LIVE:      'apif_live_2026',
  ROUNDS:    'apif_rounds_2026',
};
const TTL = {
  FIXTURES:  6 * 3600 * 1000,   // 6 ساعات
  STANDINGS: 30 * 60 * 1000,    // 30 دقيقة
  LIVE:      60 * 1000,          // 60 ثانية
  ROUNDS:    24 * 3600 * 1000,   // 24 ساعة
};

const storage = () => window.miniappsAI?.storage;

async function cacheGet(key) {
  try {
    const raw = await storage()?.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    return data;
  } catch { return null; }
}

async function cacheGetFresh(key, ttl) {
  try {
    const raw = await storage()?.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > ttl) return null;
    return data;
  } catch { return null; }
}

async function cacheSet(key, data) {
  try {
    await storage()?.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

// ── طلبات API-Football ───────────────────────────────────────────
async function apiFetch(path, apiKey) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'x-apisports-key': apiKey },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    const msg = Object.values(json.errors)[0];
    throw new Error(msg);
  }
  return json.response;
}

// ── تحويل fixture من API إلى هيكل التطبيق ───────────────────────
export function normalizeFixture(fx) {
  const home = fx.teams?.home;
  const away = fx.teams?.away;
  const score = fx.score?.fulltime || fx.goals;
  const status = fx.fixture?.status;

  let appStatus = 'upcoming';
  const shortStatus = status?.short || '';
  if (['1H','2H','ET','BT','P','SUSP','INT','LIVE'].includes(shortStatus)) appStatus = 'live';
  else if (['FT','AET','PEN'].includes(shortStatus)) appStatus = 'finished';

  const stage = fx.league?.round || '';
  const isGroup = stage.toLowerCase().includes('group');

  let appStage = 'knockout';
  let group = '';
  let matchday = null;

  if (isGroup) {
    appStage = 'group';
    const m = stage.match(/Group Stage - (\d+)/i) || stage.match(/(\d+)/);
    matchday = m ? +m[1] : null;
    const gm = stage.match(/Group ([A-L])/i);
    group = gm ? gm[1].toUpperCase() : '';
  } else {
    if (/round of 32/i.test(stage)) appStage = 'round32';
    else if (/round of 16/i.test(stage)) appStage = 'round16';
    else if (/quarter/i.test(stage)) appStage = 'quarterFinal';
    else if (/semi/i.test(stage)) appStage = 'semiFinal';
    else if (/3rd/i.test(stage) || /third/i.test(stage)) appStage = 'thirdPlace';
    else if (/final/i.test(stage)) appStage = 'final';
  }

  const hFlag = getFlag(home?.name || '');
  const aFlag = getFlag(away?.name || '');

  return {
    id:         fx.fixture?.id,
    apiRound:   stage,
    stage:      appStage,
    group,
    matchday,
    homeId:     home?.id,
    awayId:     away?.id,
    homeName:   home?.name || '?',
    awayName:   away?.name || '?',
    homeLogo:   home?.logo || '',
    awayLogo:   away?.logo || '',
    homeFlag:   hFlag,
    awayFlag:   aFlag,
    homeScore:  score?.home ?? null,
    awayScore:  score?.away ?? null,
    homeScoreHT: fx.score?.halftime?.home ?? null,
    awayScoreHT: fx.score?.halftime?.away ?? null,
    scorePEN:   shortStatus === 'PEN' ? { home: fx.score?.penalty?.home, away: fx.score?.penalty?.away } : null,
    date:       fx.fixture?.date || '',
    timestamp:  fx.fixture?.timestamp ? fx.fixture.timestamp * 1000 : new Date(fx.fixture?.date || 0).getTime(),
    venue:      fx.fixture?.venue?.name || '',
    venueCity:  fx.fixture?.venue?.city || '',
    status:     appStatus,
    statusShort: shortStatus,
    elapsed:    status?.elapsed || null,
    label:      stage,
  };
}

// ── جلب المباريات الكاملة (مع cache) ────────────────────────────
export async function fetchAllFixtures(apiKey, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = await cacheGetFresh(CACHE.FIXTURES, TTL.FIXTURES);
    if (cached) return cached;
  }

  const raw = await apiFetch(
    `/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
    apiKey
  );

  const fixtures = (raw || []).map(normalizeFixture)
    .sort((a, b) => a.timestamp - b.timestamp);

  await cacheSet(CACHE.FIXTURES, fixtures);
  return fixtures;
}

// ── جلب المباريات الحية فقط ──────────────────────────────────────
export async function fetchLiveFixtures(apiKey) {
  const cached = await cacheGetFresh(CACHE.LIVE, TTL.LIVE);
  if (cached) return cached;

  const raw = await apiFetch(
    `/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}&live=all`,
    apiKey
  );

  const fixtures = (raw || []).map(normalizeFixture);
  await cacheSet(CACHE.LIVE, fixtures);
  return fixtures;
}

// ── جلب ترتيب المجموعات ──────────────────────────────────────────
export async function fetchStandings(apiKey, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = await cacheGetFresh(CACHE.STANDINGS, TTL.STANDINGS);
    if (cached) return cached;
  }

  const raw = await apiFetch(
    `/standings?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
    apiKey
  );

  // API returns array of leagues, each with standings array of arrays
  const result = {};
  try {
    const league = raw?.[0]?.league;
    const allGroups = league?.standings || [];
    for (const group of allGroups) {
      if (!group.length) continue;
      const gName = group[0]?.group || '';
      const letter = gName.replace(/Group\s*/i, '').trim();
      if (!letter) continue;
      result[letter] = group.map((row, i) => ({
        rank:     row.rank || i + 1,
        teamId:   row.team?.id,
        teamName: row.team?.name || '',
        teamLogo: row.team?.logo || '',
        teamFlag: getFlag(row.team?.name || ''),
        played:   row.all?.played || 0,
        won:      row.all?.win    || 0,
        draw:     row.all?.draw   || 0,
        lost:     row.all?.lose   || 0,
        gf:       row.all?.goals?.for     || 0,
        ga:       row.all?.goals?.against || 0,
        gd:       row.goalsDiff || 0,
        pts:      row.points    || 0,
        form:     row.form      || '',
      }));
    }
  } catch {}

  await cacheSet(CACHE.STANDINGS, result);
  return result;
}

// ── بناء هيكل teams من fixtures ──────────────────────────────────
export function buildTeamsFromFixtures(fixtures) {
  const teams = {};
  for (const fx of fixtures) {
    if (fx.homeId && !teams[fx.homeId]) {
      teams[fx.homeId] = {
        id: fx.homeId, name: fx.homeName,
        flag: fx.homeFlag, logo: fx.homeLogo,
        code: '', country: fx.homeName,
      };
    }
    if (fx.awayId && !teams[fx.awayId]) {
      teams[fx.awayId] = {
        id: fx.awayId, name: fx.awayName,
        flag: fx.awayFlag, logo: fx.awayLogo,
        code: '', country: fx.awayName,
      };
    }
  }
  return teams;
}

// ── بناء ترتيب أولي من fixtures (قبل جلب standings) ─────────────
export function buildStandingsFromFixtures(fixtures, teams) {
  const rows = {};
  const finished = fixtures.filter(f => f.stage === 'group' && f.status === 'finished');

  // تهيئة
  for (const fx of fixtures.filter(f => f.stage === 'group')) {
    if (!fx.group) continue;
    if (!rows[fx.group]) rows[fx.group] = {};
    for (const tid of [fx.homeId, fx.awayId]) {
      if (tid && !rows[fx.group][tid]) {
        rows[fx.group][tid] = {
          rank:0, teamId:tid,
          teamName: teams[tid]?.name || '?',
          teamFlag: teams[tid]?.flag || '🏳️',
          teamLogo: teams[tid]?.logo || '',
          played:0, won:0, draw:0, lost:0, gf:0, ga:0, gd:0, pts:0, form:'',
        };
      }
    }
  }

  for (const fx of finished) {
    if (!fx.group || !rows[fx.group]) continue;
    const hg = fx.homeScore ?? 0;
    const ag = fx.awayScore ?? 0;
    const hr = rows[fx.group][fx.homeId];
    const ar = rows[fx.group][fx.awayId];
    if (hr) {
      hr.played++; hr.gf += hg; hr.ga += ag; hr.gd = hr.gf - hr.ga;
      if (hg > ag) { hr.won++; hr.pts += 3; }
      else if (hg === ag) { hr.draw++; hr.pts++; }
      else hr.lost++;
    }
    if (ar) {
      ar.played++; ar.gf += ag; ar.ga += hg; ar.gd = ar.gf - ar.ga;
      if (ag > hg) { ar.won++; ar.pts += 3; }
      else if (ag === hg) { ar.draw++; ar.pts++; }
      else ar.lost++;
    }
  }

  const result = {};
  for (const [g, teamMap] of Object.entries(rows)) {
    result[g] = Object.values(teamMap)
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }
  return result;
}

// ── إحصائيات البطولة ─────────────────────────────────────────────
export function computeTournamentStats(fixtures, teams) {
  const finished = fixtures.filter(f => f.status === 'finished');
  let totalGoals = 0;
  const teamGoals = {}, teamConceded = {};

  for (const fx of finished) {
    const hg = fx.homeScore ?? 0;
    const ag = fx.awayScore ?? 0;
    totalGoals += hg + ag;
    if (fx.homeId) { teamGoals[fx.homeId] = (teamGoals[fx.homeId]||0)+hg; teamConceded[fx.homeId]=(teamConceded[fx.homeId]||0)+ag; }
    if (fx.awayId) { teamGoals[fx.awayId] = (teamGoals[fx.awayId]||0)+ag; teamConceded[fx.awayId]=(teamConceded[fx.awayId]||0)+hg; }
  }

  const gKeys = Object.keys(teamGoals);
  const cKeys = Object.keys(teamConceded);
  const bestAtkId  = gKeys.length ? +gKeys.reduce((a,b) => teamGoals[a]>=teamGoals[b]?a:b) : null;
  const bestDefId  = cKeys.length ? +cKeys.reduce((a,b) => teamConceded[a]<=teamConceded[b]?a:b) : null;

  return {
    totalGoals, totalMatches: finished.length,
    avgGoals: finished.length ? +(totalGoals/finished.length).toFixed(2) : 0,
    bestAttackId: bestAtkId, bestAttackGoals: teamGoals[bestAtkId]||0,
    bestDefenseId: bestDefId, bestDefenseConceded: teamConceded[bestDefId]||0,
  };
}

// ── جلب إحصائيات مباراة واحدة ────────────────────────────────────
export async function fetchMatchStats(fixtureId, apiKey) {
  try {
    const raw = await apiFetch(`/fixtures/statistics?fixture=${fixtureId}`, apiKey);
    return raw || [];
  } catch { return []; }
}

// ── جلب أحداث مباراة واحدة ───────────────────────────────────────
export async function fetchMatchEvents(fixtureId, apiKey) {
  try {
    const raw = await apiFetch(`/fixtures/events?fixture=${fixtureId}`, apiKey);
    return raw || [];
  } catch { return []; }
}

// ── مسح الـ cache ────────────────────────────────────────────────
export async function clearAllCache() {
  for (const key of Object.values(CACHE)) {
    try { await storage()?.removeItem(key); } catch {}
  }
}

// ── أرشيف المونديال التاريخي ─────────────────────────────────────
export const WORLD_CUP_HISTORY = [
  { year:2022, host:'قطر 🇶🇦',              winner:'الأرجنتين 🇦🇷',        runnerUp:'فرنسا 🇫🇷',             score:'3-3 (4-2 ر.ت)' },
  { year:2018, host:'روسيا 🇷🇺',            winner:'فرنسا 🇫🇷',            runnerUp:'كرواتيا 🇭🇷',            score:'4-2' },
  { year:2014, host:'البرازيل 🇧🇷',         winner:'ألمانيا 🇩🇪',           runnerUp:'الأرجنتين 🇦🇷',          score:'1-0' },
  { year:2010, host:'جنوب أفريقيا 🇿🇦',    winner:'إسبانيا 🇪🇸',           runnerUp:'هولندا 🇳🇱',             score:'1-0' },
  { year:2006, host:'ألمانيا 🇩🇪',          winner:'إيطاليا 🇮🇹',           runnerUp:'فرنسا 🇫🇷',             score:'1-1 (5-3 ر.ت)' },
  { year:2002, host:'كوريا/اليابان 🇰🇷🇯🇵', winner:'البرازيل 🇧🇷',          runnerUp:'ألمانيا 🇩🇪',            score:'2-0' },
  { year:1998, host:'فرنسا 🇫🇷',            winner:'فرنسا 🇫🇷',            runnerUp:'البرازيل 🇧🇷',           score:'3-0' },
  { year:1994, host:'الولايات المتحدة 🇺🇸', winner:'البرازيل 🇧🇷',          runnerUp:'إيطاليا 🇮🇹',            score:'0-0 (3-2 ر.ت)' },
  { year:1990, host:'إيطاليا 🇮🇹',          winner:'ألمانيا الغربية 🇩🇪',   runnerUp:'الأرجنتين 🇦🇷',          score:'1-0' },
  { year:1986, host:'المكسيك 🇲🇽',          winner:'الأرجنتين 🇦🇷',         runnerUp:'ألمانيا الغربية 🇩🇪',    score:'3-2' },
  { year:1982, host:'إسبانيا 🇪🇸',          winner:'إيطاليا 🇮🇹',           runnerUp:'ألمانيا الغربية 🇩🇪',    score:'3-1' },
  { year:1978, host:'الأرجنتين 🇦🇷',        winner:'الأرجنتين 🇦🇷',         runnerUp:'هولندا 🇳🇱',             score:'3-1' },
  { year:1974, host:'ألمانيا الغربية 🇩🇪',  winner:'ألمانيا الغربية 🇩🇪',   runnerUp:'هولندا 🇳🇱',             score:'2-1' },
  { year:1970, host:'المكسيك 🇲🇽',          winner:'البرازيل 🇧🇷',          runnerUp:'إيطاليا 🇮🇹',            score:'4-1' },
  { year:1966, host:'إنجلترا 🏴󠁧󠁢󠁥󠁮󠁧󠁿',        winner:'إنجلترا 🏴󠁧󠁢󠁥󠁮󠁧󠁿',          runnerUp:'ألمانيا الغربية 🇩🇪',    score:'4-2' },
  { year:1962, host:'تشيلي 🇨🇱',            winner:'البرازيل 🇧🇷',          runnerUp:'تشيكوسلوفاكيا',          score:'3-1' },
  { year:1958, host:'السويد 🇸🇪',           winner:'البرازيل 🇧🇷',          runnerUp:'السويد 🇸🇪',             score:'5-2' },
  { year:1954, host:'سويسرا 🇨🇭',           winner:'ألمانيا الغربية 🇩🇪',   runnerUp:'المجر',                  score:'3-2' },
  { year:1950, host:'البرازيل 🇧🇷',         winner:'أوروغواي 🇺🇾',           runnerUp:'البرازيل 🇧🇷',           score:'2-1' },
  { year:1938, host:'فرنسا 🇫🇷',            winner:'إيطاليا 🇮🇹',           runnerUp:'المجر',                  score:'4-2' },
  { year:1934, host:'إيطاليا 🇮🇹',          winner:'إيطاليا 🇮🇹',           runnerUp:'تشيكوسلوفاكيا',          score:'2-1' },
  { year:1930, host:'أوروغواي 🇺🇾',         winner:'أوروغواي 🇺🇾',           runnerUp:'الأرجنتين 🇦🇷',          score:'4-2' },
];

export const RECORDS = [
  { title:'أكثر المنتخبات تتويجاً',    value:'البرازيل 🇧🇷 — 5 مرات (1958، 62، 70، 94، 2002)', icon:'🏆' },
  { title:'هداف تاريخ المونديال',       value:'ميروسلاف كلوزه 🇩🇪 — 16 هدفاً (4 بطولات)',      icon:'⚽' },
  { title:'أسرع هدف في التاريخ',        value:'هاكان شوكور 🇹🇷 — 11 ثانية (كوريا 2002)',        icon:'⚡' },
  { title:'أكبر فوز في التاريخ',        value:'المجر 10-1 السلفادور (إسبانيا 1982)',             icon:'📊' },
  { title:'أفضل مباراة في التاريخ',     value:'فرنسا 4-3 الأرجنتين (روسيا 2018)',               icon:'🔥' },
  { title:'أصغر لاعب يسجل',            value:'بيليه 🇧🇷 — 17 سنة و249 يوماً (السويد 1958)',    icon:'🌟' },
  { title:'أكثر مشاركة في المونديال',   value:'البرازيل 🇧🇷 — 22 نسخة متتالية',                 icon:'🗓️' },
  { title:'أعلى حضور جماهيري',          value:'البرازيل 1950 — 199,854 مشجع (ماراكانا)',         icon:'🏟️' },
  { title:'أكثر لاعب مشاركة',          value:'أنطونيو كاربخال 🇲🇽 ولوثار ماتيوس 🇩🇪 — 5 نسخ',  icon:'👑' },
  { title:'أكثر منتخب تسجيلاً',        value:'ألمانيا 🇩🇪 — 226 هدفاً في 109 مباريات',          icon:'🎯' },
];
