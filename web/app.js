"use strict";
/* Anime Hub UI — round 4 design wired to the real hub API.
   Views are string builders (Home(), Lib(), Det(), …) painted into #app; all
   interaction goes through one delegated handler keyed on data-a (table A). */
const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const S = {
  data: null, view: "home", showId: null, seasonIdx: 0, showBack: "home", cat: null,
  q: "", menu: null, alres: null, alq: null, alBusy: false,
  ani: null, settings: null, alData: null, modal: null, entry: null,
  lib: { tab: null, src: "all", fmt: "all", air: "all", year: "all", score: "all", sort: "updated", ...lsGet("hubLib", {}) },
  histRange: lsGet("histRange", "7d"), histMax: 120,
  match: {}, tour: { step: 0, choice: "connect" }, rec: null, navIn: true, countNext: false, opener: null,
  slink: {}, dl: [], releases: {}, loadingEp: null,
};

/* @pure:start */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Inline SVG icons: unicode glyphs (▶ ⋮ ✓ ♥) render as emoji or fall back unpredictably on Linux. [paths, filled?] */
const ICONS = {
  play: ['<path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l12-7.2a.8.8 0 0 0 0-1.4l-12-7.2A.8.8 0 0 0 7 4.8z"/>', 1],
  dots: ['<circle cx="12" cy="5.5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="18.5" r="1.7"/>', 1],
  star: ['<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>', 1],
  check: ['<path d="m5 12.5 4.5 4.5L19 7.5"/>'],
  checkc: ['<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.3 2.6 2.6 4.8-5.2"/>'],
  heart: ['<path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.7 3.7 4.5 7 4.5c2 0 3.7 1.1 5 3 1.3-1.9 3-3 5-3 3.3 0 5.4 3.2 4.2 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"/>'],
  back: ['<path d="M19 12H5m6-6-6 6 6 6"/>'],
  arrowr: ['<path d="M5 12h14m-6-6 6 6-6 6"/>'],
  chevl: ['<path d="m15 6-6 6 6 6"/>'],
  chevr: ['<path d="m9 6 6 6-6 6"/>'],
  ext: ['<path d="M7 17 17 7m0 0H9m8 0v8"/>'],
  download: ['<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14"/>'],
  close: ['<path d="M6 6l12 12M18 6 6 18"/>'],
  plus: ['<path d="M12 5v14M5 12h14"/>'],
  minus: ['<path d="M5 12h14"/>'],
  clock: ['<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'],
  tv: ['<rect x="3" y="5.5" width="18" height="12" rx="2.5"/><path d="M8 21h8"/>'],
  search: ['<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.6-3.6"/>'],
  refresh: ['<path d="M20 11a8 8 0 0 0-14.3-4.6L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.6L20 15.5M20 20v-4.5h-4.5"/>'],
  undo: ['<path d="M4 12a8 8 0 1 0 2.5-5.8L4 8.5M4 4v4.5h4.5"/>'],
  folder: ['<path d="M3.5 7.5a2 2 0 0 1 2-2h3.8l2.2 2.2h7a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'],
  up: ['<path d="M12 19V5m-6 6 6-6 6 6"/>'],
  /* Bottom tab bar (touch layouts). */
  home: ['<path d="M4 10.6 12 4l8 6.6V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19z"/><path d="M9.6 20.6v-6.2h4.8v6.2"/>'],
  grid: ['<rect x="3.6" y="3.6" width="7" height="7" rx="1.9"/><rect x="13.4" y="3.6" width="7" height="7" rx="1.9"/><rect x="3.6" y="13.4" width="7" height="7" rx="1.9"/><rect x="13.4" y="13.4" width="7" height="7" rx="1.9"/>'],
  chart: ['<path d="M5 20V11.5M12 20V4.5M19 20v-6"/>'],
  gear: ['<circle cx="12" cy="12" r="3.1"/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a1.9 1.9 0 1 1-3.8 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0-1.1-2.7h-.3a1.9 1.9 0 1 1 0-3.8h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5v-.3a1.9 1.9 0 1 1 3.8 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0 1.1 2.8h.3a1.9 1.9 0 1 1 0 3.8h-.2a1.6 1.6 0 0 0-1.5 1z"/>'],
};
const ico = (n, c = "") => `<svg class="ico${ICONS[n][1] ? " ico-f" : ""}${c ? " " + c : ""}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n][0]}</svg>`;
const FMT = { TV: "TV", TV_SHORT: "TV short", MOVIE: "Movie", OVA: "OVA", ONA: "ONA", SPECIAL: "Special", MUSIC: "Music" };
const fmtName = (f) => FMT[f] || f;
/* Escape text and wrap the first case-insensitive match of q in <mark>. */
const hl = (t, q) => {
  const s = String(t ?? ""), i = q ? s.toLowerCase().indexOf(q.toLowerCase()) : -1;
  return i < 0 ? esc(s) : esc(s.slice(0, i)) + "<mark>" + esc(s.slice(i, i + q.length)) + "</mark>" + esc(s.slice(i + q.length));
};

/* Stable per-title hue: the colour of a poster/banner placeholder, so a show
   without artwork still has a recognisable tile. */
function hueOf(str) {
  let h = 7;
  for (const c of String(str || "")) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) % 360;
}
const cssUrl = (u) => `url("${String(u).replace(/[\s"'()\\]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"))}")`;
const bgStyle = (url, hue) => `--h:${hue};` + (url ? `background-image:${cssUrl(url)}` : "");
const poster = (title, url, o = {}) =>
  `<div class="poster${o.c ? " " + o.c : ""}${o.wait ? " wait" : ""}" style="--h:${hueOf(title)}">${url ? `<img loading="lazy" alt="" src="${esc(url)}">` : ""}<span>${esc(title)}</span></div>`;

function fmtTime(s) {
  if (!s) return "";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}
/* Time remaining in an episode, e.g. "24 min" or "1h 12m". */
function fmtLeft(duration, position) {
  const rem = Math.max(0, (duration || 0) - (position || 0));
  return rem >= 3600 ? `${Math.floor(rem / 3600)}h ${Math.round((rem % 3600) / 60)}m` : `${Math.max(1, Math.round(rem / 60))} min`;
}
const parseStamp = (iso) => new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");

function showShortLabel(sea) {
  return sea.label.startsWith("Season") ? `S${sea.season}` : sea.label === "Specials" ? "SP" : sea.label;
}
function epCode(sea, ep) {
  if (sea.label === "Episodes") return `E${ep.number}`; // an online release's own page
  return sea.label.startsWith("Season") ? `S${sea.season}E${ep.number}` : `${showShortLabel(sea)} · E${ep.number}`;
}
function epTitle(show, sea, ep) {
  const st = sea?.titles;
  if (st) {
    const t = Array.isArray(st) ? st[ep.number - 1] : st[String(ep.number)];
    if (t) return t;
  }
  const meta = show.meta?.episodes_meta;
  if (meta && sea && meta.length === sea.episodes.length) return meta[ep.number - 1] || null;
  return null;
}
/* Season order for chips / "what to play next": main seasons first, extras last */
function seasonRank(sea) {
  const l = sea.label;
  let m;
  if ((m = l.match(/^Season (\d+)/))) return [0, +m[1]];
  if ((m = l.match(/^Part (\d+)/))) return [1, +m[1]];
  if (/final/i.test(l)) return [2, 0];
  if (/^movies?$/i.test(l)) return [3, 0];
  return [4, 0];
}
function orderedSeasons(s) {
  return s.seasons.map((sea, i) => ({ sea, i })).sort((a, b) => {
    const ra = seasonRank(a.sea), rb = seasonRank(b.sea);
    return ra[0] - rb[0] || ra[1] - rb[1] || a.i - b.i;
  });
}
const resumable = (ep) => !ep.watched && ep.duration && ep.position / ep.duration > 0.01;

function pickTarget(s) {
  const ord = orderedSeasons(s);
  let resume = null;
  for (const { sea } of ord) for (const ep of sea.episodes) {
    if (resumable(ep) && (!resume || (ep.last_played || "") > (resume.ep.last_played || ""))) resume = { sea, ep, kind: "resume" };
  }
  if (resume) return resume;
  for (const { sea } of ord) { const ep = sea.episodes.find((e) => !e.watched); if (ep) return { sea, ep, kind: "play" }; }
  const first = ord.find((x) => x.sea.episodes.length);
  return first ? { sea: first.sea, ep: first.sea.episodes[0], kind: "rewatch" } : null;
}
const KIND_WORD = { resume: "Resume", play: "Play", rewatch: "Rewatch" };
const epTotal = (s) => s.seasons.reduce((a, x) => a + x.episodes.length, 0);
const epWatched = (s) => s.seasons.reduce((a, x) => a + x.episodes.filter((e) => e.watched).length, 0);
/* Disk shows (with their release's online episodes merged in), then online-only
   releases ("aid:<id>", same shape), then release pages being browsed. */
const allShows = () => (S.data ? [...S.data.shows, ...(S.data.streams || []), ...Object.values(S.releases)] : []);
const showById = (id) => allShows().find((x) => x.id === id) || null;
const isStream = (s) => s?.kind === "stream";
const streamEp = (ep) => ep.id.startsWith("stream:");
/* The library's online-only show for a release (not a page being browsed). */
const streamOf = (mid) => (mid && S.data?.streams?.find((x) => x.id === "aid:" + mid)) || null;

function findEpContext(id) {
  for (const s of allShows()) {
    for (const sea of s.seasons) {
      const ep = sea.episodes.find((e) => e.id === id);
      if (ep) return { s, sea, ep };
    }
  }
  return null;
}

/* The hero follows the most recently touched show, period. Continue rows
   (position > 30 s) and history rows overlap — either may hold the true
   newest touch, so merge both and sort by last_played. */
function nextUpInfo() {
  const d = S.data;
  const newest = [...(d.continue || []), ...(d.history || [])]
    .filter((ep) => findEpContext(ep.id))
    .sort((a, b) => (b.last_played || "").localeCompare(a.last_played || ""))[0];
  if (!newest) return null;
  const ctx = findEpContext(newest.id);
  if (!ctx.ep.watched) return { ...ctx, label: "Continue watching", ep: ctx.ep };
  const after = ctx.sea.episodes.filter((e) => !e.watched && e.number > ctx.ep.number)[0];
  const anyUn = ctx.s.seasons.map((sea) => ({ sea, ep: sea.episodes.find((e) => !e.watched) })).filter((x) => x.ep)[0];
  if (after) return { s: ctx.s, sea: ctx.sea, ep: after, label: "Up next" };
  if (anyUn) return { s: ctx.s, sea: anyUn.sea, ep: anyUn.ep, label: "Up next" };
  return { ...ctx, label: "Rewatch", ep: ctx.ep };
}
/* Watch facts on the model, in place (marked ids only, artwork untouched):
   the show page patches itself after a mark instead of rebuilding — see
   patchShow. `reset` also clears the resume position/last-played stamp. */
function applyWatch(shows, ids, watched, reset) {
  const set = new Set(ids);
  let n = 0;
  for (const s of shows) for (const sea of s.seasons) for (const ep of sea.episodes) {
    if (!set.has(ep.id)) continue;
    ep.watched = watched;
    if (reset) { ep.position = 0; ep.last_played = null; }
    n++;
  }
  return n;
}
/* UI zoom: a client-side, per-device preference (same class as the spine
   view state), 50–200 % in steps of 10. Applied on <html> via CSS zoom;
   in shell mode ctrl+scroll / ctrl± / ctrl+0 drive it. */
const ZOOM_MIN = 50, ZOOM_MAX = 200, ZOOM_STEP = 10;
function zoomStep(cur, dir) { return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, cur + dir * ZOOM_STEP)); }
/* @pure:end */

const LISTS = [["CURRENT", "Watching"], ["REPEATING", "Rewatching"], ["PAUSED", "Paused"],
               ["DROPPED", "Dropped"], ["COMPLETED", "Completed"], ["PLANNING", "Planning"]];
const statusLabel = (st) => (LISTS.find(([v]) => v === st) || [0, st || "—"])[1];
const AIR = { RELEASING: "Airing", FINISHED_AIRING: "Finished", NOT_YET_RELEASED: "Upcoming", HIATUS: "Hiatus", CANCELLED: "Cancelled" };
const CAP = { installed: "installed", partial: "partial", none: "no source", online: "online" };
const capLabel = (c) => (c === "none" && S.data?.stream_ready ? "not available" : CAP[c] || "");
const aniMode = () => S.data?.spine?.mode === "anilist";
const localMode = () => S.data?.spine?.mode === "local";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, body) {
  const res = await fetch(path, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  try { return await res.json(); } catch { throw new Error(`HTTP ${res.status} from ${path}`); }
}
function toast(m) {
  const t = $("#toast");
  t.innerHTML = '<i class="tdot"></i><span></span><b class="ttime"></b>'; // fresh timer bar each time
  t.querySelector("span").textContent = m;
  t.classList.toggle("err", /could not|failed|error|can't|cannot|not accessible/i.test(m));
  t.classList.add("on");
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), 2400);
}
const reduceMotion = () => matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ---------- home ---------- */
/* @home:start */
function isPlayingShow(id) {
  const n = S.data.now, c = n && findEpContext(n.episode_id);
  return !!c && c.s.id === id;
}
function heroHTML(up) {
  const s = up.s, m = s.meta || {}, ep = up.ep, art = s.banner || s.poster;
  const pct = ep.duration ? Math.min(100, (ep.position / ep.duration) * 100) : 0;
  const left = pct >= 1 && !ep.watched ? ` · ${fmtLeft(ep.duration, ep.position)} left` : "";
  const chips = [m.score ? `<span class="mchip">${ico("star", "star")}${esc(m.score)}</span>` : "", m.format ? `<span class="mchip">${esc(fmtName(m.format))}</span>` : "", m.year ? `<span class="mchip">${esc(m.year)}</span>` : ""].join("");
  const desc = m.overview ? (m.overview.length > 260 ? m.overview.slice(0, 260) + "…" : m.overview) : "";
  return `<div class="hhero" style="--h:${hueOf(s.title)}"><div class="hbg"${art ? ` style="--art:${esc(cssUrl(art))}"` : ""}></div><div class="wrap">
    <div class="eyebrow">${esc(up.label)}${esc(left)}</div>
    <h1>${esc(s.title)}</h1>
    <div class="hl"><span class="ecode">${esc(epCode(up.sea, ep))}</span><span class="etitle">${esc(epTitle(s, up.sea, ep) || "Episode " + ep.number)}</span>${isPlayingShow(s.id) ? '<span class="playing"><span class="eq"><i></i><i></i><i></i></span>Playing in mpv</span>' : ""}</div>
    ${pct >= 1 && !ep.watched ? `<div class="bar" style="width:min(420px,100%)"><i style="width:${pct}%"></i></div>` : ""}
    ${chips ? `<div class="hmeta">${chips}</div>` : ""}
    ${desc ? `<p class="desc">${esc(desc)}</p>` : ""}
    <div class="cta"><button class="pill solid" data-a="play" data-v="${esc(ep.id)}">${ico("play")}<span>${resumable(ep) ? "Resume" : "Play"}</span></button><button class="pill" data-a="open" data-v="${esc(s.id)}">Details</button></div>
  </div></div>`;
}
/* One tile per show you actually played, newest first, each pointing at the
   next relevant episode. The show the hero already features is skipped. */
function keepWatching(skipId) {
  const seen = new Set(skipId ? [skipId] : []), out = [];
  const hist = (S.data.history || []).map((ep) => ({ ep, ctx: findEpContext(ep.id) })).filter((x) => x.ctx)
    .sort((a, b) => (b.ep.last_played || "").localeCompare(a.ep.last_played || ""));
  for (const x of hist) {
    if (seen.has(x.ctx.s.id)) continue;
    seen.add(x.ctx.s.id);
    const t = pickTarget(x.ctx.s);
    if (t) out.push({ s: x.ctx.s, t });
    if (out.length >= 8) break;
  }
  return out;
}
function contCard({ s, t }, k) {
  const ep = t.ep, p = ep.duration ? Math.min(100, (ep.position / ep.duration) * 100) : 0;
  const total = epTotal(s), w = epWatched(s), pct = total ? Math.round((100 * w) / total) : 0;
  const lead = `${KIND_WORD[t.kind]} ${epCode(t.sea, ep)}`, art = s.banner || s.poster;
  const sub = p > 1 && !ep.watched ? `${lead} · ${fmtLeft(ep.duration, ep.position)} left` : lead;
  return `<button class="cont" style="--h:${hueOf(s.title)};--i:${k}" data-a="open" data-v="${esc(s.id)}">
    ${art ? `<span class="cbg" style="background-image:${esc(cssUrl(art))}"></span>` : ""}
    <div class="cont-top">${isPlayingShow(s.id) ? '<span class="playing"><span class="eq"><i></i><i></i><i></i></span>Now playing</span>' : "<span></span>"}</div>
    <div><h3>${esc(s.title)}</h3><div class="cont-meta"><b>${esc(sub)}</b><span>${w}/${total}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div></button>`;
}
function Home() {
  const d = S.data, up = nextUpInfo();
  const L = keepWatching(up && up.s.id);
  const touched = new Set((d.history || []).map((e) => e.show_id));
  const fresh = d.shows.filter((s) => !touched.has(s.id) && s.poster && epTotal(s) > 0).slice(0, 6);
  const airing = aniMode() ? d.spine.entries.filter((e) => e.airing === "RELEASING" && (e.local_show_id || e.capability === "online") && inProg(e.status)).slice(0, 5) : [];
  let body = "";
  if (L.length) body += `<div class="sec first"><h2>Keep watching</h2><div class="sec-r"><button class="arr" data-a="strip" data-d="-1" aria-label="Scroll left" disabled>${ico("chevl")}</button><button class="arr" data-a="strip" data-d="1" aria-label="Scroll right">${ico("chevr")}</button><button class="link-btn" data-a="go" data-v="history">History${ico("arrowr")}</button></div></div><div class="strip">${L.map(contCard).join("")}</div>`;
  if (fresh.length || airing.length) {
    body += `<div class="two ${airing.length ? "" : "one"}">
      <div>${fresh.length ? `<div class="sec"><h2>Ready to start</h2><button class="link-btn" data-a="go" data-v="library">All shows${ico("arrowr")}</button></div><div class="mini">${fresh.map((s) =>
        `<button class="card" data-a="open" data-v="${esc(s.id)}"><div class="pw">${poster(s.title, s.poster)}</div><h3>${esc(s.title)}</h3><div class="m"><span class="src installed">${epTotal(s)} ep</span></div></button>`).join("")}</div>` : ""}</div>
      ${airing.length ? `<div><div class="sec"><h2>Airing</h2></div>${airing.map((e) => {
        const s = showById(e.local_show_id), p = e.episodes ? Math.min(100, ((e.progress || 0) / e.episodes) * 100) : 0;
        const n = e.next_episode?.number, have = s ? s.seasons.flatMap((x) => x.episodes).filter((x) => !streamEp(x)).length : 0;
        return `<button class="airing" data-a="entry" data-v="${esc(e.id)}"><div class="al-top"><i class="live"></i><b>${esc(e.title)}</b></div><div class="al-bar"><i style="width:${p}%"></i></div><div class="al-meta"><span>${e.progress || 0}/${e.episodes || "?"} watched</span><small>${have ? `${have} on disk` : n ? `E${n - 1} is out` : "Online"}</small></div></button>`;
      }).join("")}</div>` : ""}</div>`;
  }
  if (!up && !body) {
    body = `<div class="emptyx"><div class="eico">${ico("tv")}</div>${d.shows.length
      ? `<b>Nothing watched yet</b><span>Your library is waiting.</span><button class="btn pri" data-a="go" data-v="library">Browse library</button>`
      : d.stream_ready ? `<b>Nothing watched yet</b><span>Search for a show to start watching — or add your anime folder in Settings → Library.</span>`
      : `<b>Your library is empty</b><span>Choose your anime folder in Settings → Library.</span>`}</div>`;
  }
  return `${up ? heroHTML(up) : ""}<div class="wrap page" style="padding-top:${up ? 0 : 20}px">${body}</div>`;
}
/* @home:end */

/* ---------- library ---------- */
const YR = { "2020s": (y) => y >= 2020, "2010s": (y) => y >= 2010 && y < 2020, "2000s": (y) => y >= 2000 && y < 2010, "Before 2000": (y) => y < 2000 };
const SC = { "9–10": (n) => n >= 9, "7–8": (n) => n >= 7 && n < 9, "5–6": (n) => n >= 5 && n < 7, "Under 5": (n) => n < 5 };
const SORT = {
  updated: (a, b) => (b.updated || 0) - (a.updated || 0), score: (a, b) => (b.score || 0) - (a.score || 0),
  year: (a, b) => (b.year || 0) - (a.year || 0), title: (a, b) => (a.title || "").localeCompare(b.title || ""),
};
const inProg = (st) => ["CURRENT", "REPEATING", "PAUSED"].includes(st);
const unmatchedShows = () => S.data.shows.filter((s) => !s.meta?.anilist_id);

function libModel() {
  const d = S.data, sp = d.spine;
  if (!sp) return { cold: true, tabs: [], entries: [], untracked: [], unmatched: unmatchedShows() };
  const counts = {};
  for (const e of sp.entries) counts[e.status] = (counts[e.status] || 0) + 1;
  const tabs = LISTS.filter(([k]) => counts[k]).map(([k, l]) => ({ k, l, n: counts[k] }));
  if (sp.entries.length) tabs.unshift({ k: "ALL", l: "All", n: sp.entries.length });
  const untracked = sp.untracked.map(showById).filter((s) => s && s.meta?.anilist_id);
  const unmatched = unmatchedShows();
  if (untracked.length) tabs.push({ k: "UNTRACKED", l: "Untracked", n: untracked.length });
  if (unmatched.length) tabs.push({ k: "MATCH", l: "To match", n: unmatched.length, attn: true });
  return { tabs, entries: sp.entries, untracked, unmatched };
}
function fixTab(m) {
  if (m.cold || !m.tabs.length) return;
  if (!m.tabs.some((t) => t.k === S.lib.tab)) S.lib.tab = m.tabs[0].k;
}
function libFiltered(m) {
  const f = S.lib;
  return m.entries.filter((e) => (f.tab === "ALL" || e.status === f.tab)
    && (srcLocked() || f.src === "all" || e.capability === f.src)
    && (f.fmt === "all" || e.format === f.fmt)
    && (f.air === "all" || e.airing === f.air)
    && (f.year === "all" || (e.year != null && YR[f.year](e.year)))
    && (f.score === "all" || (e.score > 0 && SC[f.score](e.score)))).sort(SORT[f.sort] || SORT.updated);
}
function entryCard(e, i) {
  const s = e.local_show_id ? showById(e.local_show_id) : null;
  const tg = s ? pickTarget(s) : null;
  const res = tg && tg.kind === "resume" && inProg(e.status) ? tg : null;
  const prog = e.progress || 0, pct = e.episodes ? Math.min(100, Math.round((100 * prog) / e.episodes)) : 0;
  const hint = [FMT[e.format] || e.format, AIR[e.airing]].filter(Boolean).join(" · ");
  return `<button class="card" style="--i:${Math.min(i, 24)}" data-a="entry" data-v="${esc(e.id)}">
    <div class="pw">${poster(e.title, e.poster, { wait: S.data.meta_running && !e.poster })}${hint ? `<span class="hint">${esc(hint)}</span>` : ""}
    ${res ? `<span class="resume-tag">${ico("play")}${esc(epCode(res.sea, res.ep))}${res.ep.position ? " · " + fmtTime(res.ep.position) : ""}</span>` : ""}
    ${inProg(e.status) && pct ? `<div class="prog"><i style="width:${pct}%"></i></div>` : ""}</div>
    <h3>${esc(e.title)}</h3>
    <div class="m"><span>${prog}/${e.episodes || "?"}</span><span class="src ${esc(e.capability)}">${capLabel(e.capability)}</span>${e.score ? `<span class="sc">${ico("star")}${Math.round(e.score * 10) / 10}</span>` : ""}</div></button>`;
}
function showCard(s, i) {
  const total = epTotal(s), w = epWatched(s), pct = total ? Math.round((100 * w) / total) : 0;
  return `<button class="card" style="--i:${Math.min(i, 24)}" data-a="open" data-v="${esc(s.id)}">
    <div class="pw">${poster(s.title, s.poster, { wait: S.data.meta_running && !s.poster })}${s.collection ? `<span class="hint">${esc(s.collection)}</span>` : ""}
    ${pct ? `<div class="prog"><i style="width:${pct}%"></i></div>` : ""}</div>
    <h3>${esc(s.title)}</h3><div class="m"><span>${w}/${total}</span><span class="src installed">installed</span></div></button>`;
}

/* AniList match repair (TODO 28): suggestions come from the same search the
   manual field uses; picking one writes the match. */
const mst = (id) => (S.match[id] ||= { cands: null, pick: 0, busy: false, err: "", q: "", tried: false });
const candLabel = (x) => x.title?.english || x.title?.romaji || `#${x.id}`;
function matchUI(s) {
  const m = mst(s.id), c = (m.cands || []).slice(0, 5), n = epTotal(s);
  return `<div class="match" data-show="${esc(s.id)}"><div class="match-head"><b>${esc(s.title)}</b><span class="sub">${n} episode${n === 1 ? "" : "s"} on disk · no AniList match yet</span></div>
    ${m.busy ? '<div class="found"><i class="spin"></i>Searching AniList…</div>' : ""}
    ${c.length ? `<div class="cands">${c.map((x, i) => `<button class="cand ${i === m.pick ? "on" : ""}" data-a="pick" data-s="${esc(s.id)}" data-v="${i}">${poster(candLabel(x), null)}<b>${esc(candLabel(x))}</b><small>${esc([x.seasonYear || x.startDate?.year, FMT[x.format] || x.format, x.episodes ? x.episodes + " eps" : ""].filter(Boolean).join(" · "))}</small>${i === m.pick ? "<em>selected</em>" : ""}</button>`).join("")}</div>`
      : m.cands && !m.busy ? '<p class="sub">No AniList results for that title.</p>' : ""}
    <div class="row"><input id="mq-${esc(s.id)}" aria-label="Search AniList" placeholder="Search AniList, or paste an ID or anilist.co URL" value="${esc(m.q)}"><button class="btn" data-a="msearch" data-v="${esc(s.id)}">Search</button></div>
    ${m.err ? `<div class="msg">${esc(m.err)}</div>` : ""}
    <div class="row">${c.length ? `<button class="btn pri" data-a="match" data-v="${esc(s.id)}">Match to “${esc(candLabel(c[m.pick] || c[0]))}”</button>` : ""}<button class="btn" data-a="keeplocal">Not on AniList — keep local</button></div></div>`;
}
function paintMatch(id) {
  const el = document.querySelector(`.match[data-show="${CSS.escape(id)}"]`), s = showById(id);
  if (el && s) el.outerHTML = matchUI(s);
}
let candQ = Promise.resolve();
async function runSearch(id, text) {
  const m = mst(id);
  m.busy = true; m.err = ""; paintMatch(id);
  try {
    const r = await api("/api/match-candidates", { query: text });
    if (r && r.error) { m.err = r.error; m.cands = []; } else { m.cands = r || []; m.pick = 0; }
  } catch { m.err = "Search failed — is the hub running?"; m.cands = []; }
  m.busy = false; paintMatch(id);
}
function autoSuggest(list) {
  for (const s of list.slice(0, 5)) {
    const m = mst(s.id);
    if (m.tried || m.cands || m.busy) continue;
    m.tried = true;
    candQ = candQ.then(() => runSearch(s.id, s.title));
  }
}

function scanNote() {
  const scan = S.data.scan;
  if (!scan) return null;
  const bits = [];
  if (scan.root === "changed") bits.push("Your library folder changed — reconnect the new folder to pick your shows back up.");
  if (scan.state === "unconfigured") bits.push("No library folder is configured yet — choose one in Settings.");
  if (scan.state === "missing") bits.push("The library folder is not accessible right now.");
  else if (scan.state === "partial") bits.push("Some folders could not be read — part of the library may be missing.");
  return bits.length ? bits.join(" ") : null;
}
const metaText = (d) => `Fetching ${d.meta_phase || "metadata"} · ${d.meta_pending} left${d.meta_current ? ` · ${d.meta_current}` : ""}`;
/* Local mode is disk-only (source filter locked) until ani-cli streams add "online" entries. */
const srcLocked = () => localMode() && !S.data.spine.entries.some((e) => e.capability === "online");
const filtersActive = () => ["fmt", "air", "year", "score"].some((k) => S.lib[k] !== "all") || (!srcLocked() && S.lib.src !== "all");
const fsel = (k, label, opts, locked) => {
  const set = !locked && k !== "sort" && S.lib[k] !== "all";
  return `<label class="fl">${label}<select data-a="filt" data-k="${k}" class="${set ? "set" : ""}" ${locked ? "disabled" : ""}>${(locked ? [opts[1]] : opts).map(([v, l]) => `<option value="${esc(v)}" ${v === S.lib[k] || locked ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
};
/* Keep the "set" tint and the Clear button in step with the selects without rebuilding them (focus stays put). */
function syncFilters() {
  const f = $(".filters");
  if (!f) return;
  $$(".filters select[data-k]").forEach((s) => s.classList.toggle("set", s.dataset.k !== "sort" && !s.disabled && S.lib[s.dataset.k] !== "all"));
  const any = filtersActive(), b = f.querySelector(".clr");
  if (any && !b) {
    const n = document.createElement("button");
    n.className = "btn clr"; n.dataset.a = "fclear"; n.innerHTML = ico("close") + "Clear";
    f.insertBefore(n, f.querySelector(".fill"));
  } else if (!any && b) b.remove();
}

function Lib() {
  const d = S.data, m = libModel();
  fixTab(m);
  if (srcLocked() && S.lib.src !== "installed") S.lib.src = "installed";
  const note = scanNote();
  const notes = [];
  if (note) notes.push(`<div class="note-bar">${esc(note)}${d.scan?.root === "changed" ? ' <button class="btn" data-a="adopt">Connect folder</button>' : ""}</div>`);
  else if (d.meta_running && d.meta_pending > 0) notes.push(`<div class="note-bar metanote"><i class="spin"></i><span>${esc(metaText(d))}</span></div>`);
  if (m.cold && S.ani?.connected) notes.push('<div class="note-bar">Your AniList lists are still loading — showing what is on disk.</div>');
  const isMatch = S.lib.tab === "MATCH" && !m.cold, isUn = S.lib.tab === "UNTRACKED" && !m.cold;
  const tabs = m.tabs.length ? `<div class="tabs" data-glide="libtabs">${m.tabs.map((t) => `<button class="${S.lib.tab === t.k ? "on" : ""}${t.attn ? " attn" : ""}" data-a="tab" data-v="${t.k}">${t.l}<sup>${t.n}</sup></button>`).join("")}</div>` : `<div class="sec first"><h2>Library</h2><span class="sub">${d.shows.length} shows</span></div>`;
  let main;
  if (isMatch) {
    autoSuggest(m.unmatched);
    main = `<p class="sub" style="margin-top:22px">On disk, but not matched to AniList yet. Pick the right entry, or keep it local.</p>${m.unmatched.map(matchUI).join("")}`;
  } else {
    const filters = (m.cold || isUn) ? "" : `<div class="filters">
      ${fsel("src", "Source", [["all", "any"], ["installed", "installed"], ["partial", "partial"], ["online", "online"], ["none", capLabel("none")]], srcLocked())}
      ${fsel("fmt", "Format", [["all", "any"], ["TV", "TV"], ["MOVIE", "Movie"], ["OVA", "OVA"], ["ONA", "ONA"], ["SPECIAL", "Special"]])}
      ${fsel("air", "Airing", [["all", "any"], ["RELEASING", "Airing"], ["FINISHED_AIRING", "Finished"], ["NOT_YET_RELEASED", "Upcoming"]])}
      ${fsel("year", "Year", [["all", "any"], ...Object.keys(YR).map((k) => [k, k])])}
      ${fsel("score", "Score", [["all", "any"], ...Object.keys(SC).map((k) => [k, k])])}
      ${filtersActive() ? `<button class="btn clr" data-a="fclear">${ico("close")}Clear</button>` : ""}
      <span class="fill"></span>${fsel("sort", "Sort by", [["updated", "Recently updated"], ["score", "Score"], ["year", "Year"], ["title", "Title"]])}
      <button class="btn" data-a="rescan" title="Rescan library & fetch missing metadata">${ico("refresh")}Rescan</button></div>`;
    main = `${filters}<div id="wall"></div>`;
  }
  return `<div class="wrap">${notes.join("")}${tabs}${main}</div>`;
}
function paintWall(fade) {
  const w = $("#wall");
  if (!w) return;
  const m = libModel();
  let html;
  if (m.cold) html = S.data.shows.map(showCard).join("");
  else if (S.lib.tab === "UNTRACKED") html = m.untracked.map(showCard).join("");
  else html = libFiltered(m).map(entryCard).join("");
  w.className = "wall" + (fade && !reduceMotion() ? " fade" : "");
  w.innerHTML = html || `<div class="emptyx" style="grid-column:1/-1"><div class="eico">${ico("search")}</div><b>${m.entries.length || S.data.shows.length ? "Nothing matches these filters." : "No shows found."}</b>${m.entries.length || S.data.shows.length ? "" : "<span>Check your library folder, then rescan.</span>"}</div>`;
}

/* ---------- detail ---------- */
const alUrl = (id) => `https://anilist.co/anime/${id}`;
const alChip = (id) => id ? `<a class="chip al" href="${alUrl(id)}" data-a="ext" data-v="${alUrl(id)}" title="Open on AniList">AniList${ico("ext")}</a>` : "";
function fmtIn(sec) {
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${Math.max(1, m)} min`;
}
/* @detail:start */
const epThumbOf = (thumbs, ep) => !thumbs ? null : Array.isArray(thumbs) ? (thumbs[ep.number - 1] || null) : (thumbs[String(ep.number)] || null);

function epTile(s, sea, ep, tgId, i = 0) {
  /* Art order (Elias, 2026-10-17): the matched per-episode still when the
     listing has one, otherwise the show poster on EVERY tile — slicing the
     banner per episode made each tile a different, magnified crop ("the
     episodes get different images… it zooms in"). */
  const rt = epThumbOf(sea.thumbs, ep), art = rt || s.poster || s.banner;
  const pos = rt ? "50% 50%" : s.poster ? "50% 22%" : "50% 50%";
  const pct = ep.duration ? Math.min(100, (100 * ep.position) / ep.duration) : 0;
  const part = !ep.watched && pct > 1;
  const files = ep.files || [], online = streamEp(ep), unavail = online && (!S.data.stream_ready || s.stream?.unavailable);
  const loading = epLoading(ep.id), job = online && dlJob(ep.id);
  const cls = ["ep", ep.watched ? "watched" : "", ep.id === tgId && resumable(ep) ? "resume" : "", art ? "" : "noart", loading ? "loading" : "", unavail ? "off" : ""].filter(Boolean).join(" ");
  const sub = loading ? "Loading…" : job ? (job.status === "running" ? `Downloading · ${Math.floor(job.percent)}%` : "Waiting to download")
    : ep.watched ? "Watched" : part ? `Resume · ${fmtLeft(ep.duration, ep.position)} left` : `E${ep.number}`;
  const chip = !online ? `<span class="src installed">${files.length > 1 ? files.length + " versions" : "installed"}</span>`
    : unavail ? '<span class="src none">not available</span>' : '<span class="src online">online</span>';
  return `<div class="${cls}" tabindex="0" data-a="${unavail ? "unavail" : "playep"}" data-v="${esc(ep.id)}" style="--h:${hueOf(s.title)};--i:${Math.min(i, 16)}">
    <span class="epimg" data-bg="${esc(art || "")}" data-bp="${pos}"></span>
    <em class="ghost">E${ep.number}</em>${part ? `<i class="eprog"><i style="width:${pct}%"></i></i>` : ""}${job?.status === "running" ? `<i class="eprog dl"><i style="width:${job.percent}%"></i></i>` : ""}
    <span class="eplay">${loading ? '<i class="spin"></i>' : ico("play")}</span>
    <div class="et"><b>${esc(epTitle(s, sea, ep) || "Episode " + ep.number)}</b><small>${esc(sub)}</small></div>
    ${chip}${ep.watched ? `<i class="tick">${ico("check")}</i>` : ""}
    <button class="dots" aria-label="Episode ${ep.number} menu" data-a="cm" data-v="${esc(ep.id)}">${ico("dots")}</button></div>`;
}
/* @detail:end */
/* ---------- online episodes (ani-cli, v0.2) ----------
   ani-cli works out of sight: the hub matches every release to it by
   itself, and online episodes are just episodes. The only way a source
   ever surfaces is "Wrong episodes?", for the rare bad match. */
const SLMODES = [["sub", "Sub"], ["dub", "Dub"]];
const dlJob = (id) => S.dl.find((j) => `stream:${j.media_id}:${j.token}` === id && (j.status === "running" || j.status === "queued"));
const epLoading = (id) => id === S.loadingEp || (!!S.data.now?.loading && S.data.now.episode_id === id);
/* The disk show a release lives in, when there is one (merged list). */
function releaseHome(mid) {
  const c = S.data.shows.filter((s) => s.meta?.anilist_id === mid);
  return c.find((s) => s.stream) || c.find((s) => s.seasons.length === 1) || c[0] || null;
}
/* A release page drawn at once from what the card knew; /api/release
   replaces it with AniList's details a moment later. */
function releaseHint(mid, h = {}) {
  const n = Math.max(0, Math.min(h.episodes || 0, 2000));
  const eps = Array.from({ length: n }, (_, i) => ({ id: `stream:${mid}:${i + 1}`, number: i + 1, token: String(i + 1), files: [], watched: false, position: 0, duration: 0, last_played: null }));
  return { id: "aid:" + mid, kind: "stream", title: h.title || "", poster: h.poster || null, banner: h.banner || null, movie: h.format === "MOVIE" && n <= 1,
           meta: { anilist_id: mid, title: h.title, year: h.year, format: h.format, score: h.score },
           seasons: [{ key: 1, season: 1, label: "Episodes", episodes: eps, thumbs: null, titles: null }],
           stream: { provisional: true, pending: true, ready: !!S.data.stream_ready, mode: S.settings?.stream?.mode || "sub", total: h.total } };
}
const airedOf = (e) => (e.airing === "RELEASING" && e.next_episode?.number ? e.next_episode.number - 1 : e.episodes);
const hintFromEntry = (e) => ({ title: e.title, poster: e.poster, year: e.year, format: e.format, episodes: airedOf(e), total: e.episodes });
const hintFromCand = (x) => ({ title: candLabel(x), poster: x.coverImage?.extraLarge, banner: x.bannerImage, year: x.seasonYear || x.startDate?.year,
                               format: x.format, score: x.averageScore, episodes: x.episodes, total: x.episodes });
/* Open any AniList release: its disk show if there is one, else its own page. */
function openRelease(mid, hint) {
  const home = releaseHome(mid);
  if (home) return openShow(home.id);
  if (!streamOf(mid) && !S.releases[mid]) S.releases[mid] = releaseHint(mid, hint);
  openShow("aid:" + mid);
  if (!streamOf(mid)) loadRelease(mid);
}
function repaintShow(id) { if (S.view === "show" && S.showId === id) softRender(); }
/* Fill a release page from the hub, and follow the background match:
   once it lands, the show is in the library payload with its real list. */
const releasing = new Set();
async function loadRelease(mid) {
  if (releasing.has(mid)) return;
  releasing.add(mid);
  try {
    let r = null;
    for (let i = 0; i < 60; i++) {
      r = await api("/api/release?id=" + mid).catch(() => null);
      if (r?.show && r.show.id === "aid:" + mid && !streamOf(mid)) { S.releases[mid] = r.show; repaintShow("aid:" + mid); }
      if (!r?.resolving) break;
      await sleep(1500);
    }
    if (r && !r.show?.stream?.provisional) {
      await refreshData();
      if (streamOf(mid)) { delete S.releases[mid]; repaintShow("aid:" + mid); }
    }
  } finally { releasing.delete(mid); }
}
/* A matched single-season folder: its release's online episodes join it
   once the hub has matched the release (first visit). */
const homeTried = new Set();
async function resolveHome(s) {
  const mid = s?.meta?.anilist_id;
  if (!mid || isStream(s) || s.stream || s.seasons.length !== 1 || s.kind === "movie" || !S.data.stream_ready || homeTried.has(mid)) return;
  homeTried.add(mid);
  for (let i = 0; i < 60; i++) {
    const r = await api("/api/release?id=" + mid).catch(() => null);
    if (!r?.resolving) break;
    await sleep(1500);
  }
  await refreshData();
  if (showById(s.id)?.stream) repaintShow(s.id);
}
const dlBtn = (mid, eps, label) => `<button class="dl-btn" data-a="dlmany" data-v="${mid}" data-eps="${esc(JSON.stringify(eps))}">${ico("download")}${label}</button>`;

/* "Wrong episodes?": the manual override for a bad automatic match. */
const slst = (mid) => (S.slink[mid] ||= { q: "", res: null, pick: 0, busy: "", err: "" });
const normT = (t) => String(t || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "");
function SrcDlg() {
  const { mid, title } = S.modal, st = slst(mid), res = st.res || [], cur = res[st.pick];
  return `<h2 id="dt">Wrong episodes?</h2>
  <p class="sub">Pick the search result that is “${esc(title)}”. Your choice is kept.</p>
  <div class="row" style="margin-top:14px"><input id="slq" aria-label="Search" placeholder="Search for the show" value="${esc(st.q)}"><button class="btn" data-a="slsearch">${ico("search")}Search</button></div>
  ${st.busy ? `<div class="found"><i class="spin"></i>${esc(st.busy)}</div>` : ""}
  ${res.length ? `<div class="slres" style="margin-top:12px">${res.map((r, i) => `<button class="mi${i === st.pick ? " on" : ""}" data-a="slpick" data-v="${i}">${ico(i === st.pick ? "checkc" : "tv")}<span><b>${esc(r.title || st.q)}</b>${r.title ? "" : "<small>The only result for this search</small>"}</span></button>`).join("")}</div>`
    : st.res && !st.busy ? '<p class="sub" style="margin-top:12px">Nothing found — try another spelling.</p>' : ""}
  <div class="msg">${esc(st.err)}</div>
  <div class="actions"><button class="btn" data-a="close">Cancel</button>${cur ? `<button class="btn pri" data-a="sllink" ${st.busy ? "disabled" : ""}>Use this one</button>` : "<span></span>"}</div>`;
}
async function slSearch(mid, text, titles) {
  const st = slst(mid);
  st.q = text; st.busy = "Searching…"; st.err = ""; paintModal();
  try {
    const r = await api("/api/stream/search", { query: text });
    if (r && r.error) { st.err = r.error; st.res = []; }
    else {
      st.res = r.results || []; st.q = r.query || text;
      const want = new Set((titles || []).map(normT).filter(Boolean));
      st.pick = Math.max(0, st.res.findIndex((x) => want.has(normT(x.title))));
    }
  } catch { st.err = "Search failed — is the hub running?"; st.res = []; }
  st.busy = "";
  if (S.modal?.t === "src") paintModal();
}
function openSrc(s) {
  const mid = s.meta.anilist_id, st = slst(mid);
  openModal({ t: "src", mid, title: s.meta.title || s.title });
  if (!st.res) slSearch(mid, s.meta.title || s.title, [s.meta.title, s.title]);
}

function backLabel() { return S.showBack === "library" ? "Library" : S.showBack === "history" ? "History" : S.showBack === "stats" ? "Stats" : "Home"; }

function Det() {
  const s = showById(S.showId), meta = s.meta || {}, tg = pickTarget(s);
  const sea = s.seasons[S.seasonIdx] || s.seasons[0];
  const hue = hueOf(s.title), matched = !!meta.anilist_id, release = isStream(s), st = s.stream || {};
  const ready = !!S.data.stream_ready, unavail = release && (st.unavailable || !ready), prov = !!st.provisional;
  const movie = s.kind === "movie" || s.movie;
  const goLabel = tg ? `${KIND_WORD[tg.kind]}${movie ? "" : " " + epCode(tg.sea, tg.ep)}` : "";
  const goBusy = tg && epLoading(tg.ep.id);
  const online = sea ? sea.episodes.filter((e) => streamEp(e) && !dlJob(e.id)) : [];
  const dl = ready && !unavail && online.length ? dlBtn(meta.anilist_id, online.map((e) => e.id.split(":")[2]), movie ? "Download" : release ? "Download all" : "Download missing") : "";
  const flat = s.seasons.flatMap((x) => x.episodes);
  const seaAll = sea && sea.episodes.length > 0 && sea.episodes.every((e) => e.watched), showAll = flat.length > 0 && flat.every((e) => e.watched);
  const bulk = !flat.length || prov ? "" : `${sea && sea.episodes.length ? `<button class="btn" data-a="bulk" data-s="${S.seasonIdx}" data-w="${!seaAll}">${ico(seaAll ? "undo" : "check")}${seaAll ? "Unwatch season" : "Mark season watched"}</button>` : ""}<button class="btn" data-a="bulk" data-s="" data-w="${!showAll}">${ico(showAll ? "undo" : "check")}${showAll ? "Unwatch all" : "Mark all watched"}</button>`;
  const info = [["Format", meta.format ? FMT[meta.format] || meta.format : movie ? "Movie" : "—"], ["Year", meta.year || "—"], ["Episodes", st.total || epTotal(s) || "—"]];
  const chips = `${meta.format ? `<span class="mchip">${esc(FMT[meta.format] || meta.format)}</span>` : ""}${meta.year ? `<span class="mchip">${esc(meta.year)}</span>` : ""}${meta.score ? `<span class="mchip">${ico("star", "star")}${esc(meta.score)}</span>` : ""}`;
  const playing = isPlayingShow(s.id) ? `<span class="playing"><span class="eq"><i></i><i></i><i></i></span>${S.data.now.loading ? "Loading" : "Playing in mpv"} · ${esc(S.data.now.label)}</span>` : "";
  /* The only surfaced bit of the source: a fix for a bad automatic match. */
  const fix = ready && matched && (s.stream && !prov) ? '<button class="link-btn fix" data-a="srcfix">Wrong episodes?</button>' : "";
  const note = !release || !unavail ? "" : `<p class="sub eps-note">${ready ? `Not available to watch online. <button class="link-btn fix" data-a="srcfix">Find it manually</button>` : "Install ani-cli to watch this online."}</p>`;
  return `<div class="banner" style="${esc(bgStyle(s.banner || s.poster, hue))}"></div>
  <button class="pill backbtn" data-a="back">${ico("back")}${backLabel()}</button>
  <div class="wrap"><div class="hero" style="margin-top:-250px">${poster(s.title, s.poster)}<div>
    <h1>${esc(s.title)}</h1>
    <div class="meta">${playing}<span class="live-t" id="airline"></span>${chips}${alChip(meta.anilist_id)}</div>
    ${meta.overview ? `<p class="desc" style="margin-top:14px">${esc(meta.overview)}</p>` : ""}
    <div class="cta">${tg && !unavail ? `<button class="pill solid${goBusy ? " loading" : ""}" data-a="play" data-v="${esc(tg.ep.id)}">${goBusy ? '<i class="spin"></i>' : ico("play")}<span>${goBusy ? "Loading…" : esc(goLabel)}</span></button>` : ""}${matched ? "" : '<span class="warn">Unmatched — no AniList entry yet</span>'}</div>
  </div></div>
  <div class="body"><section>
    ${matched ? "" : `<h2 style="font-size:26px;margin-bottom:6px">Match this show</h2>${(autoSuggest([s]), matchUI(s))}<div style="height:34px"></div>`}
    ${s.seasons.length > 1 ? `<div class="rels" data-glide="seasons">${orderedSeasons(s).map(({ sea: x, i }) => {
      const uw = x.episodes.filter((e) => !e.watched).length;
      return `<button class="${i === S.seasonIdx ? "on" : ""}" data-a="season" data-v="${i}">${esc(x.label)}${uw ? ` · ${uw}` : ""}</button>`;
    }).join("")}</div>` : ""}
    <div class="eps-head"><h2>${movie ? "Movie" : "Episodes"}</h2><div class="ctl">${bulk}${dl}</div></div>${note}
    ${sea && sea.episodes.length ? `<div class="eps">${sea.episodes.map((ep, i) => epTile(s, sea, ep, tg && tg.ep.id, i)).join("")}</div>`
      : `<p class="sub">${st.pending ? '<i class="spin"></i> Loading…' : release && prov ? "No episodes are out yet." : "No episodes."}</p>`}
  </section><aside>
    ${matched ? `<div class="panel"><h3>Your entry</h3><div id="entrybox"><p class="note">Loading…</p></div></div>
      <div class="panel"><h3>From AniList</h3><dl class="form" id="infobox">${infoDl(info)}</dl>${fix}</div>`
    : `<div class="panel"><h3>Details</h3><dl class="form">${infoDl([["Folder", s.path || s.title], ...info.slice(2)])}</dl></div>`}
  </aside></div></div>`;
}
const infoDl = (rows) => rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");

/* ---------- AniList entry panel (TODO 9, Decision 10) ---------- */
let entryBusy = false;
function entryFields(res) {
  const prev = S.entry && S.entry.f;
  if (res.queued && prev && !prev.local) {
    /* Queued while connected: the reply carries the local overlay. Keep the
       connected layout and fold the saved values into what was shown. */
    const e = res.entry || {}, p = res.patch || {};
    return { ...prev, status: e.status ?? prev.status, score: e.score ?? prev.score, progress: p.progress ?? prev.progress,
             repeat: e.rewatches ?? prev.repeat, started_at: "started_at" in p ? p.started_at || null : prev.started_at,
             completed_at: "completed_at" in p ? p.completed_at || null : prev.completed_at,
             favourite: e.favourite != null ? !!e.favourite : prev.favourite };
  }
  if (res.local) {
    const e = res.entry || {};
    return { status: e.status || null, score: e.score ?? null, progress: null, repeat: e.rewatches || 0,
             started_at: e.started_at || null, completed_at: e.finished_at || null, favourite: !!e.favourite, local: true, score_max: 10, media: {} };
  }
  const st = res.state || (res.entry && res.media_id ? res : {}), e = st.entry || {};
  return { status: e.status || null, score: e.score ?? null, progress: e.progress ?? 0, repeat: e.repeat ?? 0,
           started_at: e.started_at || null, completed_at: e.completed_at || null, favourite: !!st.is_favourite, local: false,
           score_format: st.score_format, score_max: st.score_max, media: st };
}
function entryHTML(f, pending) {
  const max = f.score_max || 10, dec = (f.score_format || "").includes("DECIMAL");
  const fmtLabel = (f.score_format || "POINT_10").replace("POINT_", "").replace("_", ".");
  const media = f.media || {}, show = S.view === "show" ? showById(S.showId) : null;
  const stp = (k, v, lab, cap) => `<span class="stepper"><button aria-label="Decrease ${lab}" data-a="ebump" data-k="${k}" data-d="-1">${ico("minus")}</button><b data-k="${k}">${v}${cap ? " / " + cap : ""}</b><button aria-label="Increase ${lab}" data-a="ebump" data-k="${k}" data-d="1">${ico("plus")}</button></span>`;
  const sel = `<select aria-label="Status" data-a="eset" data-k="status">${f.status ? "" : '<option value="">—</option>'}${LISTS.map(([v, l]) => `<option value="${v}" ${f.status === v ? "selected" : ""}>${l}</option>`).join("")}</select>`;
  return `${f.local ? '<p class="note">Saved on this device only — syncs when AniList connects.</p>' : ""}${pending ? '<p class="note"><span class="chip warn">Waiting to sync</span></p>' : ""}
  <dl class="form"><dt>Status</dt><dd>${sel}</dd>
  <dt>Score</dt><dd><input type="number" aria-label="Score" min="0" max="${max}" step="${dec ? 0.1 : 1}" value="${f.score ?? ""}" placeholder="–" data-a="eset" data-k="score" style="width:90px"> <span class="dim">/ ${max} (${esc(fmtLabel)})</span></dd>
  <dt>Progress</dt><dd>${f.local ? `<span title="Follows your watched episodes">${show ? epWatched(show) + " / " + epTotal(show) : "—"}</span>` : stp("progress", f.progress ?? 0, "progress", media.episodes || "")}</dd>
  <dt>Rewatches</dt><dd>${stp("repeat", f.repeat ?? 0, "rewatches")}</dd>
  <dt>Started</dt><dd><input type="date" aria-label="Start date" value="${esc(f.started_at || "")}" data-a="eset" data-k="started_at"></dd>
  <dt>Finished</dt><dd><input type="date" aria-label="Finish date" value="${esc(f.completed_at || "")}" data-a="eset" data-k="completed_at"></dd>
  <dt>Favourite</dt><dd><button class="heart ${f.favourite ? "on" : ""}" aria-label="Favourite" aria-pressed="${f.favourite}" data-a="efav">${ico("heart")}</button></dd></dl>`;
}
function entryDraw(res) {
  const box = $("#entrybox");
  if (!box || !S.entry) return;
  const prev = S.entry.f, f = entryFields(res);
  S.entry.f = f; S.entry.res = res;
  box.innerHTML = entryHTML(f, !!(res.pending || res.queued));
  if (prev && !reduceMotion()) for (const k of ["progress", "repeat"]) if (prev[k] !== f[k]) box.querySelector(`.stepper b[data-k="${k}"]`)?.classList.add("pop2");
  const m = f.media || {}, next = m.next_episode;
  const air = $("#airline");
  if (air) air.textContent = next ? (next.in_seconds > 0 ? `Airing · E${next.number} in ${fmtIn(next.in_seconds)}` : `E${next.number} has aired`) : "";
  const ib = $("#infobox");
  if (ib && !f.local) {
    const meta = showById(S.showId)?.meta || {};
    ib.innerHTML = infoDl([["Format", meta.format ? FMT[meta.format] || meta.format : "—"], ["Year", meta.year || "—"],
      ...(m.popularity != null ? [["Popularity", m.popularity.toLocaleString()]] : []), ...(m.favourites != null ? [["Favourites", m.favourites.toLocaleString()]] : []),
      ...(m.studios && m.studios.length ? [["Studios", m.studios.join(", ")]] : []),
      ...(next ? [["Next airing", `E${next.number} in ${fmtIn(Math.max(0, next.in_seconds))}`]] : [])]);
  }
}
let entryTok = 0;
function loadEntry(mid) {
  const tok = ++entryTok;
  S.entry = { mid, f: null, res: null };
  api("/api/entry?id=" + mid).then((res) => {
    if (tok !== entryTok || !$("#entrybox")) return;
    if (res && res.error) {
      $("#entrybox").innerHTML = `<span class="chip warn">${esc(res.error)}</span>${res.auth ? ' <button class="btn" data-a="ani" style="margin-left:8px">Connect</button>' : ""}`;
      return;
    }
    entryDraw(res);
  }).catch(() => { if (tok === entryTok && $("#entrybox")) $("#entrybox").innerHTML = '<span class="chip warn">Could not reach the hub.</span>'; });
}
/* One write path for every edit. Favourite travels beside the patch — never
   instead of it — so a combined save (the completion popup) keeps both. */
function entrySave(mid, patch, fav) {
  const body = { media_id: mid };
  if (patch && Object.keys(patch).length) body.patch = patch;
  if (fav !== undefined) body.favourite = fav;
  return api("/api/entry", body);
}
function entryPatch(patch, fav) {
  if (entryBusy || !S.entry) return;
  entryBusy = true;
  entrySave(S.entry.mid, patch, fav).then((res) => {
    if (res && res.error) { toast(res.error); return; }
    toast(res && res.queued ? "Saved — will sync when AniList is reachable" : patch && patch.status ? `Listed: ${statusLabel(patch.status)}` : "Saved");
    if (res && res.queued) res.patch = patch || {};
    entryDraw(res);
    if (fav !== undefined) { const h = $("#entrybox .heart"); if (h) { h.classList.add("pop1"); if (fav) burstAt(h); } }
    if (patch && patch.status) refreshData();
  }).catch(() => toast("Could not save — is the hub running?")).finally(() => { entryBusy = false; });
}

/* ---------- history ---------- */
const HIST_RANGES = [
  ["24h", "Last 24 hours", 86400000], ["3d", "Last 3 days", 3 * 86400000], ["7d", "Last 7 days", 7 * 86400000],
  ["1mo", "Last month", 30 * 86400000], ["6mo", "Last 6 months", 182 * 86400000], ["1y", "Last year", 365 * 86400000], ["all", "Unlimited", null],
];
function historyRows() {
  const range = HIST_RANGES.find((r) => r[0] === S.histRange) || HIST_RANGES[2];
  const cutoff = range[2] ? Date.now() - range[2] : null;
  return (S.data.history || []).map((ep) => ({ ep, ctx: findEpContext(ep.id) })).filter((x) => x.ctx)
    .filter((x) => cutoff === null || (x.ep.last_played && parseStamp(x.ep.last_played).getTime() >= cutoff))
    .sort((a, b) => (b.ep.last_played || "").localeCompare(a.ep.last_played || ""));
}
function dayLabel(d) {
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const d0 = new Date(d); d0.setHours(0, 0, 0, 0);
  const days = Math.round((t0 - d0) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: d.getFullYear() === t0.getFullYear() ? undefined : "numeric" });
}
function Hist() {
  const rows = historyRows(), shown = rows.slice(0, S.histMax);
  let last = null, out = "";
  for (const [idx, { ep, ctx }] of shown.entries()) {
    const d = parseStamp(ep.last_played), key = dayLabel(d);
    if (key !== last) { out += `<h3 class="day">${esc(key)}</h3>`; last = key; }
    const st = ep.watched ? "Finished" : ep.position ? `Stopped at ${fmtTime(ep.position)}` : "Started";
    const prg = !ep.watched && ep.duration && ep.position ? Math.min(100, (ep.position / ep.duration) * 100) : 0;
    const t = epTitle(ctx.s, ctx.sea, ep);
    out += `<button class="hr" style="--i:${Math.min(idx, 12)}" data-a="open" data-v="${esc(ctx.s.id)}">${poster(ctx.s.title, ctx.s.poster, { c: "t" })}<span><b>${esc(ctx.s.title)}</b><br><span class="sub">${esc(epCode(ctx.sea, ep))}${t ? " · " + esc(t) : ""}</span></span><span class="hs sub"><span>${ep.watched ? ico("check") : ""}${esc(st)}</span>${prg ? `<span class="hp"><i style="width:${prg}%"></i></span>` : ""}</span><span class="src ${streamEp(ep) ? "online" : "installed"}" style="justify-self:start">${streamEp(ep) ? "online" : "installed"}</span><span class="sub" style="text-align:right">${esc(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</span></button>`;
  }
  return `<div class="wrap page"><div class="sec first"><h2>History</h2><label class="fl" style="display:inline-grid">Show<select data-a="hrange">${HIST_RANGES.map(([k, l]) => `<option value="${k}" ${k === S.histRange ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
    ${out || `<p class="empty" style="padding:40px 0">Nothing watched ${S.histRange === "all" ? "yet" : "in this range"}.</p>`}
    ${rows.length > shown.length ? `<div class="eps-more"><button class="btn" data-a="histmore">Show more (${rows.length - shown.length} left)</button></div>` : ""}</div>`;
}

/* ---------- stats ---------- */
function statsEntries() {
  if (aniMode() && S.alData?.entries) return S.alData.entries;
  return S.data.spine?.entries || [];
}
function barCols(items, fmt) {
  const mx = Math.max(...items.map((x) => x[1]), 1);
  return `<div class="cols-bar${items.length > 14 ? " many" : ""}">${items.map(([l, v], i) =>
    `<div tabindex="0" data-v="${esc(fmt(v))}" title="${esc(l)}: ${esc(fmt(v))}" style="--p:${(v / mx) * 100}"><i style="height:${(v / mx) * 100}%;animation-delay:${i * 40}ms"></i><span>${items.length > 20 && i % 3 ? "" : esc(l)}</span></div>`).join("")}</div>`;
}
const DONUT_COLORS = ["var(--accent)", "var(--online)", "var(--ok)", "var(--warn)", "var(--mute)", "var(--line)"];
function donut(segs) {
  const total = segs.reduce((a, s) => a + s.v, 0) || 1;
  let off = 0, arcs = "";
  let ki = 0;
  for (const s of segs) {
    const len = (s.v / total) * 100;
    arcs += `<circle cx="60" cy="60" r="46" fill="none" stroke="${s.c}" stroke-width="16" pathLength="100" stroke-dasharray="${Math.max(len - 1, 0.4)} 100" stroke-dashoffset="${-off}" data-k="${ki}" style="--k:${ki++}" transform="rotate(-90 60 60)"><title>${esc(s.l)} · ${s.v}</title></circle>`;
    off += len;
  }
  return `<svg class="donut" viewBox="0 0 120 120" role="img" aria-label="Distribution"><circle cx="60" cy="60" r="46" fill="none" stroke="var(--s2)" stroke-width="16"/>${arcs}<text x="60" y="66" text-anchor="middle" fill="var(--ink)" font-size="20" font-weight="700">${segs.reduce((a, s) => a + s.v, 0)}</text></svg>`;
}
function Stats() {
  const d = S.data, E = statsEntries(), u = aniMode() ? S.alData?.user : null;
  const minutes = u ? u.minutes_watched : d.stats.minutes, eps = u ? u.episodes_watched : d.stats.episodes_watched;
  const scored = E.filter((e) => e.score > 0), done = E.filter((e) => e.status === "COMPLETED").length;
  const mean = u && u.mean_score ? (u.mean_score / 10).toFixed(1) : scored.length ? (scored.reduce((a, e) => a + e.score, 0) / scored.length).toFixed(1) : "—";
  /* hours per month: from the real watch history (episodes finished on this device) */
  const MN = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" "), month = {};
  for (const ep of d.history || []) if (ep.watched && ep.last_played && ep.duration) {
    const t = parseStamp(ep.last_played), k = t.getFullYear() * 12 + t.getMonth();
    month[k] = (month[k] || 0) + ep.duration / 3600;
  }
  const now = new Date(), nk = now.getFullYear() * 12 + now.getMonth();
  const months = Array.from({ length: 12 }, (_, i) => { const k = nk - 11 + i; return [`${MN[((k % 12) + 12) % 12]} ${String(Math.floor(k / 12)).slice(2)}`, Math.round((month[k] || 0) * 10) / 10]; });
  const byList = LISTS.map(([k, l]) => [l, E.filter((e) => e.status === k).length]).filter((x) => x[1]);
  const fmts = {};
  for (const e of E) { const k = FMT[e.format] || e.format || "Unknown"; fmts[k] = (fmts[k] || 0) + 1; }
  const fseg = Object.entries(fmts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([l, v], i) => ({ l, v, c: DONUT_COLORS[i] }));
  const years = {};
  for (const e of E) if (e.year) years[e.year] = (years[e.year] || 0) + 1;
  const ys = Object.keys(years).map(Number), yItems = ys.length ? Array.from({ length: Math.max(...ys) - Math.min(...ys) + 1 }, (_, i) => [String(Math.min(...ys) + i), years[Math.min(...ys) + i] || 0]) : [];
  const dist = Array.from({ length: 10 }, (_, i) => [String(i + 1), scored.filter((e) => Math.round(e.score) === i + 1).length]);
  const lmax = Math.max(...byList.map((x) => x[1]), 1), ftot = fseg.reduce((a, s) => a + s.v, 0) || 1;
  const hb = (k, c, i, mx) => `<div class="hb" title="${esc(k)}" tabindex="0"><span>${esc(k)}</span><div><i style="width:${(c / mx) * 100}%;animation-delay:${i * 60}ms"></i></div><span class="sub">${c}</span></div>`;
  const note = aniMode() && !u ? '<p class="stat-note">Loading your full AniList totals…</p>' : "";
  return `<div class="wrap page"><div class="sec first"><h2>Stats</h2><span class="sub">${aniMode() ? `AniList${u ? " · " + esc(u.name) : ""}` : "Based on progress stored on this device"}</span></div>
  <div class="tiles"><div class="tile">${ico("clock")}<b data-n="${Math.round(minutes / 60)}" data-s=" h">${Math.round(minutes / 60)} h</b><span>Time watched</span></div><div class="tile">${ico("tv")}<b data-n="${eps}">${eps}</b><span>Episodes</span></div><div class="tile">${ico("checkc")}<b data-n="${done}">${done}</b><span>Shows completed</span></div><div class="tile">${ico("star")}<b ${mean !== "—" ? `data-n="${mean}" data-d="1"` : ""}>${mean}</b><span>Mean score</span></div></div>${note}
  <div class="pgrid"><div class="panel wide2"><h3>Hours watched per month <span class="sub" style="font-weight:400;font-size:13px">on this device</span></h3>${barCols(months, (v) => v + " h")}</div>
  <div class="panel"><h3>Shows by list</h3>${byList.map(([k, c], i) => hb(k, c, i, lmax)).join("") || '<p class="sub">No list data yet.</p>'}</div>
  <div class="panel"><h3>Formats</h3><div class="fmt-split">${donut(fseg)}<div class="legend">${fseg.map((s, i) => `<span data-k="${i}"><i style="background:${s.c}"></i>${esc(s.l)} · ${s.v} (${Math.round((s.v / ftot) * 100)}%)</span>`).join("")}</div></div></div>
  <div class="panel"><h3>Release year</h3>${yItems.length ? barCols(yItems, (v) => v + " shows") : '<p class="sub">No year data yet.</p>'}</div>
  <div class="panel"><h3>Scores you give</h3>${scored.length ? barCols(dist, (v) => v + " shows") : '<p class="sub">No scores yet.</p>'}</div></div></div>`;
}
function loadAlData() {
  if (!aniMode() || S.alData || loadAlData.busy) return;
  loadAlData.busy = true;
  api("/api/anilist").then((res) => {
    if (res && res.user) { S.alData = res; if (S.view === "stats") { S.countNext = true; render(true); } }
  }).catch(() => {}).finally(() => { loadAlData.busy = false; });
}

/* ---------- settings ---------- */
const srow = (t, desc, ctl) => `<div class="srow"><div><b>${t}</b><p>${desc}</p></div><div class="ctl">${ctl}</div></div>`;
const tgl = (key, label, on, off) => `<button class="switch" role="switch" aria-checked="${!!on}" aria-label="${esc(label)}" data-a="adv" data-v="${key}" ${off ? "disabled" : ""}></button>`;
const toolRow = (name, path, hint) => srow(name, path ? `<code>${esc(path)}</code>` : esc(hint), `<span class="chip"><i class="dot ${path ? "ok" : ""}"></i>${path ? "found" : "not found"}</span>`);
/* Settings → App: install as a PWA / check the offline shell. The row states
   what applies to the device that is looking at it (already installed, an
   offer available, iOS's manual path, or an unsupported browser). */
function appRow() {
  if (standalone()) return srow("Installed app", "Anime Hub is running as an installed app on this device — it opens in its own window, offline shell included.", '<span class="chip"><i class="dot ok"></i>installed</span>');
  const o = installOffer();
  if (o?.kind === "prompt") return srow("Install", "Add Anime Hub to your home screen or desktop: it opens in its own window, without browser chrome.", '<button class="btn pri" data-a="install">Install</button>');
  if (o?.kind === "ios") return srow("Install", "On iPhone or iPad open the Share menu, then choose “Add to Home Screen”. It then opens full-screen like an app.", '<span class="chip"><i class="dot ok"></i>available</span>');
  return srow("Install", "This browser doesn't offer app installation. On Chrome, Edge or Android it installs from here or from the address bar; on iOS use Share → Add to Home Screen.",
    '<button class="btn" data-a="installhow">How to install</button>');
}
function Sett() {
  const s = S.settings, ani = S.ani || {};
  if (!s) { loadSettings().then(() => S.view === "settings" && render(true)); return '<div class="wrap page"><p class="empty">Could not reach the hub — retrying…</p></div>'; }
  const stateTxt = { ok: "Watching this folder.", unconfigured: "No library folder is configured yet.", missing: "The folder is not accessible right now.", partial: "Some folders could not be read — part of the library may be missing." };
  const changed = s.scan?.root === "changed", conn = !!ani.connected, off = !conn;
  return `<div class="wrap page"><div class="settings"><div class="sec first"><h2>Settings</h2></div>
  <div class="group"><h3>Library</h3>${srow("Library folder", `${esc(stateTxt[s.scan?.state] || "")} ${s.scan?.state === "unconfigured" ? "Choose the folder that holds your anime." : "Browse to pick another one."}${changed ? " The configured folder differs from the indexed one — connect it to pick your shows back up." : ""}`,
      `<div class="path">${libPath("settings", s)}${dirBtn("settings")}<button class="btn" data-a="rescan">Rescan</button>${changed ? '<button class="btn pri" data-a="adopt">Connect folder</button>' : ""}</div>`)}${DirPick("settings")}</div>
  <div class="group"><h3>Detected tools</h3>${toolRow("mpv", s.tools?.mpv, "Required for playback — install mpv.")}${toolRow("ani-cli", s.tools?.["ani-cli"] && s.tools["ani-cli"] + (s.stream?.version ? " · " + s.stream.version : ""), "Optional — lets you watch and download episodes you don't have.")}${toolRow("upscayl", s.tools?.upscayl, "Optional — upscales banners when the config enables it.")}</div>
  ${streamGroup(s)}
  <div class="group"><h3>AniList</h3>${srow("Account", conn ? `Your AniList lists are the sections of your library.${ani.expires_at ? " Token expires " + new Date(ani.expires_at * 1000).toLocaleDateString() + "." : ""}` : ani.expired ? "The saved token has expired — reconnect." : "Not connected. Everything runs on local watch state.",
      conn ? `<span><i class="avatar">${esc((ani.user || "?")[0].toUpperCase())}</i>${esc(ani.user || "")}</span><button class="btn" data-a="ani">Manage</button>` : '<button class="btn pri" data-a="ani">Connect AniList</button>')}</div>
  <div class="group ${off ? "off" : ""}"><h3>Advanced AniList</h3>${off ? '<p class="sub">Connect AniList to use these.</p>' : ""}
    ${srow("Track episodes", "After playback marks an episode watched, publish the highest watched episode to AniList (single-season releases).", tgl("auto_progress_sync", "Track episodes", s.auto_progress_sync))}
    ${srow("Add shows automatically", "A first watch of a matched show that isn't on your lists adds it to Watching. Off by default.", tgl("auto_add_watch", "Add shows automatically", s.auto_add_watch))}
    ${srow(`Sync ratings<span class="soon">not built yet</span>`, "Keep scores in step between AniList and this device.", tgl("ratings", "Sync ratings", false, true))}</div>
  <div class="group"><h3>App</h3>${appRow()}</div>
  <div class="group"><h3>Appearance</h3>${srow("Zoom", "Scales the whole interface on this device.", `<span class="zrow"><button class="btn" data-a="zoomout" aria-label="Zoom out">−</button><span class="zval" id="zoomval">${zoomGet()}%</span><button class="btn" data-a="zoomin" aria-label="Zoom in">+</button></span>`)}</div>
  <div class="group"><h3>Data</h3>${srow("Config file", `<code>${esc(s.config_path)}</code>`, "")}${srow("Data folder", `<code>${esc(s.data_dir)}</code>`, "")}${srow("Server", `Port ${esc(String(s.port))} · window mode “${esc(s.window)}”.`, "")}</div>
  <div class="group"><h3>Setup</h3>${srow("First-run tour", "Walk through the library folder and AniList again.", '<button class="btn" data-a="tour">Replay tour</button>')}</div></div></div>`;
}
const QLABEL = { best: "Best available", worst: "Smallest" };
function streamGroup(s) {
  const st = s.stream || {}, off = !s.tools?.["ani-cli"];
  return `<div class="group ${off ? "off" : ""}"><h3>Online episodes</h3>${off ? '<p class="sub">Install ani-cli to watch and download episodes you don\'t have.</p>' : ""}
    ${srow("Quality", "For watching and downloading online episodes.", `<select aria-label="Stream quality" data-a="spref" data-k="stream_quality" ${off ? "disabled" : ""}>${(st.qualities || []).map((q) => `<option value="${q}" ${q === st.quality ? "selected" : ""}>${QLABEL[q] || q + "p"}</option>`).join("")}</select>`)}
    ${srow("Audio", "Sub or dub for online episodes. Any episode's menu plays the other one.", `<span class="seg" role="group" aria-label="Default audio">${SLMODES.map(([m, l]) => `<button class="${st.mode === m ? "on" : ""}" aria-pressed="${st.mode === m}" data-a="spref" data-k="stream_mode" data-v="${m}" ${off ? "disabled" : ""}>${l}</button>`).join("")}</span>`)}
    ${srow("Downloads", "Saved into your library folder, one folder per show.", "")}</div>`;
}
/* Library folder picker (Decision 32): one inline folder browser shared by
   Settings and the tour's first step (ctx). It renders from S.dir and paints
   into its own slot, so walking folders never rebuilds the page or replays the
   tour dialog's swap. It unfolds from the folder field: the field follows the
   browsed folder, Browse toggles it like Cancel. Choosing writes library_root
   to the config file. */
const libPath = (ctx, s) => `<input id="libpath-${ctx}" aria-label="Library folder" value="${esc(s.library_root || "")}" placeholder="Choose a folder…" autocomplete="off" spellcheck="false">`;
const dirBtn = (ctx) => `<button class="btn" id="dirbtn-${ctx}" data-a="dirbrowse" aria-expanded="${S.dir?.ctx === ctx}" aria-controls="dirpick-${ctx}">Browse…</button>`;
function dirCrumbs(path) {
  const parts = path.split("/").filter(Boolean), last = parts.length - 1;
  const seg = (label, to, cur) => cur ? `<b aria-current="location">${esc(label)}</b>` : `<button data-a="dirgo" data-v="${esc(to)}">${esc(label)}</button>`;
  return seg("/", "/", last < 0) + parts.map((x, i) => `${i ? "<i>/</i>" : ""}${seg(x, "/" + parts.slice(0, i + 1).join("/"), i === last)}`).join("");
}
function DirPick(ctx) {
  const p = S.dir;
  if (!p || p.ctx !== ctx) return `<div id="dirpick-${ctx}" hidden></div>`;
  const cur = S.settings?.library_root, fresh = !p.shown; p.shown = true;
  const n = p.dirs?.length, place = p.path && [...(p.places || [])].sort((x, y) => y.path.length - x.path.length).find((x) => p.path === x.path || p.path.startsWith(x.path + "/"));
  const note = p.err ? `<span class="dp-note err">${esc(p.err)}</span>`
    : p.confirm ? `<span class="dp-note">Switch from <code>${esc(cur)}</code>? Watch history and AniList data are kept; shows that aren't in the new folder leave the library until their files are back.</span>`
    : `<span class="dp-note">${n ? `${n} folder${n === 1 ? "" : "s"}` : ""}</span>`;
  return `<div id="dirpick-${ctx}" class="dirpick${fresh ? " in" : ""}" role="group" aria-label="Choose your library folder"><div class="dp-well">
    <div class="dp-bar"><button class="btn dp-up" data-a="dirgo" data-v="${esc(p.parent || "")}" ${p.parent ? "" : "disabled"} aria-label="Parent folder" title="Parent folder">${ico("up")}</button>
      <nav class="dp-crumbs" aria-label="Folder path">${p.path ? dirCrumbs(p.path) : ""}</nav>
      ${p.places?.length ? `<div class="dp-places">${p.places.map((x) => `<button class="chip ${x === place ? "on" : ""}" data-a="dirgo" data-v="${esc(x.path)}">${esc(x.label)}</button>`).join("")}</div>` : ""}</div>
    <div class="dp-list">${p.dirs == null ? '<p class="dim">Loading…</p>' : !p.dirs.length ? `<p class="dp-empty">${ico("folder")}<span>No subfolders here — you can still use this folder.</span></p>` : p.dirs.map((d) => `<button class="dp-dir" data-a="dirgo" data-v="${esc(d.path)}">${ico("folder")}<span>${esc(d.name)}</span></button>`).join("")}</div>
    <div class="dp-foot ${p.confirm ? "ask" : ""}">${note}${p.confirm
      ? '<button class="btn" data-a="dirconfirm" data-v="0">Back</button><button class="btn pri" data-a="dirconfirm" data-v="1">Switch folder</button>'
      : `<button class="btn" data-a="dirclose">Cancel</button><button class="btn pri" data-a="diruse" ${p.path ? "" : "disabled"}>Use this folder</button>`}</div></div></div>`;
}
/* Edge fades replace the list's scrollbar: shown only where more folders hide. */
function dirFade(l) { l.classList.toggle("ft", l.scrollTop > 2); l.classList.toggle("fb", l.scrollTop + l.clientHeight < l.scrollHeight - 2); }
document.addEventListener("scroll", (e) => e.target.classList?.contains("dp-list") && dirFade(e.target), true);
function paintDir(ctx = S.dir?.ctx) {
  const el = $("#dirpick-" + ctx);
  if (!el) return;
  const had = el.contains(document.activeElement);
  el.outerHTML = DirPick(ctx);
  $("#dirbtn-" + ctx)?.setAttribute("aria-expanded", String(S.dir?.ctx === ctx));
  const box = $("#dirpick-" + ctx), cr = box.querySelector(".dp-crumbs"), l = box.querySelector(".dp-list");
  if (cr) cr.scrollLeft = cr.scrollWidth; // the deepest folder stays in view
  if (l) dirFade(l);
  if (had) box.querySelector(":is(.dp-dir,[data-a=diruse],[data-a=dirconfirm][data-v='1']):not(:disabled)")?.focus();
}
async function dirGo(path) {
  const p = S.dir;
  if (!p) return;
  p.confirm = false; p.err = "";
  let r;
  try { r = await api("/api/browse" + (path ? "?path=" + encodeURIComponent(path) : "")); } catch { r = { error: "Could not reach the hub." }; }
  if (S.dir !== p) return; // closed meanwhile
  if (r.error && !p.path && path) { await dirGo(""); p.err = r.error; } // a bad typed path still opens a listing
  else if (r.error) p.err = r.error;
  else { Object.assign(p, r); const f = $("#libpath-" + p.ctx); if (f) f.value = p.path; }
  paintDir();
}
function dirClose() {
  const ctx = S.dir?.ctx;
  S.dir = null;
  const f = $("#libpath-" + ctx);
  if (f) f.value = S.settings?.library_root || "";
  paintDir(ctx);
}
async function dirSet(path) {
  let r;
  try { r = await api("/api/library-root", { path, adopt: true }); } catch { r = { error: "Could not reach the hub." }; }
  if (!S.dir) return;
  if (!r.ok) { S.dir.confirm = false; S.dir.err = r.error || "Could not use this folder."; paintDir(); return; }
  S.dir = null;
  toast("Library folder set — scanning…");
  await loadSettings();
  await reload();
  api("/api/refresh", {}).catch(() => {});
  if (S.modal?.t === "tour") paintModal(); else if (S.view === "settings") render();
}
async function loadSettings() {
  try { S.settings = await api("/api/settings"); } catch { S.settings = null; }
  return S.settings;
}

/* ---------- nav, search, downloads ---------- */
const VIEWS = ["home", "library", "history", "stats", "settings"];
function srHTML() {
  const q = S.q.trim(), ql = q.toLowerCase();
  if (!q) return "";
  const hits = (S.data?.shows || []).filter((s) => `${s.collection || ""} ${s.title}`.toLowerCase().includes(ql)).slice(0, 6);
  let h = hits.map((s, i) => `<button style="--i:${i}" class="mi" data-a="open" data-v="${esc(s.id)}">${poster(s.title, s.poster, { c: "t" })}<span><b>${hl(s.title, q)}</b><small>${esc(s.collection || `${epTotal(s)} episodes · installed`)}</small></span></button>`).join("");
  if (!hits.length) h += '<p class="cap">No matches in your library</p>';
  if (alSearchable()) {
    if (S.alres) {
      h += '<div class="cap">AniList results</div>' + (S.alres.slice(0, 6).map((x, i) => {
        const e = aniMode() ? S.data.spine.entries.find((y) => y.id === x.id) : null;
        const sub = e ? "On your list · " + statusLabel(e.status) : [x.seasonYear || x.startDate?.year, FMT[x.format] || x.format].filter(Boolean).join(" · ");
        return `<button style="--i:${i}" class="mi" data-a="catpick" data-v="${i}">${poster(candLabel(x), x.coverImage?.extraLarge, { c: "t" })}<span><b>${hl(candLabel(x), q)}</b><small>${esc(sub)}</small></span></button>`;
      }).join("") || '<p class="cap">No matches on AniList</p>');
    } else if (S.alBusy) h += '<div class="cap"><i class="spin"></i> Searching AniList…</div>';
    else h += `<button class="mi srch" data-a="alsearch">${ico("search")}Search AniList for “${esc(q)}”</button>`;
  }
  return `<div class="pop sr">${h}</div>`;
}
/* AniList's catalog search needs no account: offered in AniList mode, and to
   anyone with ani-cli (finding something to stream). */
const alSearchable = () => aniMode() || !!S.data?.stream_ready;
const DL_STATE = { queued: "Waiting", running: "Downloading", done: "Downloaded", failed: "Failed", cancelled: "Cancelled" };
function dlPop() {
  const rows = S.dl.slice().reverse().map((j) => {
    const live = j.status === "running" || j.status === "queued";
    return `<div class="dlj ${j.status}"><div class="dlj-t"><b>${esc(j.show)} · E${esc(j.token)}</b><small>${esc(DL_STATE[j.status] || j.status)}${j.status === "running" ? ` · ${Math.floor(j.percent)}%` : ""}${j.error ? " — " + esc(j.error) : ""}</small>
      ${j.status === "running" ? `<div class="bar"><i style="width:${j.percent}%"></i></div>` : ""}</div>${live ? `<button class="chip ib" aria-label="Cancel download" title="Cancel" data-a="dlcancel" data-v="${j.id}">${ico("close")}</button>` : ""}</div>`;
  }).join("");
  const over = S.dl.some((j) => j.status !== "running" && j.status !== "queued");
  return `<div class="pop dl"><div class="cap">Downloads</div>${rows || '<p class="dl-empty">Nothing downloading.</p>'}
    ${over ? '<div class="row" style="padding:6px 8px 0"><button class="btn" data-a="dlclear">Clear finished</button></div>' : ""}
    ${S.data?.stream_ready ? "" : '<p class="dl-empty">Install ani-cli to download episodes.</p>'}</div>`;
}
let navSig = "", nrLast = "";
/* Bottom tab bar (touch layouts; hidden by CSS on pointer devices). Mirrors
   the top-bar links so a phone gets app-shaped navigation that sits under
   the thumb, and carries the same live signals as the desktop chips: a dot
   on Home while something is playing, one on Settings while changes wait to
   sync. */
const TABS = [["home", "Home", "home"], ["library", "Library", "grid"], ["history", "History", "clock"], ["stats", "Stats", "chart"], ["settings", "Settings", "gear"]];
function paintTabs() {
  const bar = $("#tabbar");
  if (!bar) return;
  const cur = S.view === "show" ? "library" : S.view;
  const playing = !!S.data?.now;
  const badge = { home: playing ? "" : null, settings: S.outbox ? "warn" : null };
  bar.innerHTML = TABS.map(([k, label, ic]) => {
    const b = badge[k];
    return `<button class="tab${cur === k ? " on" : ""}" ${cur === k ? 'aria-current="page"' : ""} data-a="go" data-v="${k}" aria-label="${label}">${ico(ic)}${b !== null && b !== undefined ? `<i class="tbadge ${b}"></i>` : ""}<span>${label}</span></button>`;
  }).join("");
}
function paintNav() {
  const cur = S.view === "show" ? "library" : S.view;
  const links = $("#links");
  links.innerHTML = [[ "home", "Home"], ["library", "Library"], ["history", "History"], ["stats", "Stats"], ["settings", "Settings"]]
    .map(([k, n]) => `<button class="link ${cur === k ? "on" : ""}" ${cur === k ? 'aria-current="page"' : ""} data-a="go" data-v="${k}">${n}</button>`).join("");
  glide(links);
  paintTabs();
  $("#q").placeholder = alSearchable() ? "Search library or AniList" : "Search your library";
  const sr = $("#sr"), srHad = !!sr.firstElementChild;
  sr.innerHTML = S.menu === "sr" ? srHTML() : "";
  if (!srHad && sr.firstElementChild) sr.firstElementChild.classList.add("in"); // entrance only on open, not on every keystroke
  const now = S.data?.now, ctx = now && findEpContext(now.episode_id), pct = now ? Math.round(now.percent) : 0;
  const nr = $("#nr"), dlHad = !!nr.querySelector(".pop"), dlActive = S.dl.filter((j) => j.status === "running" || j.status === "queued").length;
  const html = `${now ? `<button class="chip np" style="--pct:@P@%" ${ctx ? `data-a="open" data-v="${esc(ctx.s.id)}"` : ""}><span class="eq"><i></i><i></i><i></i></span><span class="npt">${esc(now.show)} · ${esc(now.label)}</span><span class="pc">${now.loading ? "Loading" : "@P@%"}</span></button>` : ""}
    ${S.outbox ? `<button class="chip sync" data-a="sync">${ico("refresh")}${S.outbox} change${S.outbox === 1 ? "" : "s"} waiting to sync</button>` : ""}
    <div class="rel"><button class="chip ib${dlActive ? " dl-on" : ""}" aria-label="Downloads" aria-expanded="${S.menu === "dl"}" data-a="menu" data-v="dl">${ico("download")}${dlActive ? `<span class="pc">${dlActive}</span>` : ""}</button>${S.menu === "dl" ? dlPop() : ""}</div>`;
  if (html === nrLast) {
    /* Only the playback percent moved: patch in place so the progress fill glides instead of snapping. */
    const np = nr.querySelector(".np");
    if (np) { np.style.setProperty("--pct", pct + "%"); np.querySelector(".pc").textContent = pct + "%"; }
  } else {
    nr.innerHTML = html.replaceAll("@P@", pct); nrLast = html;
    if (!dlHad) nr.querySelector(".pop")?.classList.add("in");
  }
}

/* ---------- context menu ---------- */
/* Touch (and any narrow viewport) gets a bottom sheet instead of a menu
   anchored to the pointer: there is no "right-click" on a phone, the sheet
   is reached by press-and-hold (see the long-press handler below), and it
   is far easier to hit with a thumb. The same markup drives both. */
const sheetMode = () => matchMedia("(hover:none)").matches || innerWidth <= 640;
function openCm(id, x, y) {
  const ctx = findEpContext(id);
  if (!ctx) return;
  const { ep, sea, s } = ctx, files = ep.files || [], m = $("#cm");
  const online = streamEp(ep), ok = online && S.data.stream_ready && !s.stream?.unavailable;
  const mode = s.stream?.mode || S.settings?.stream?.mode || "sub", other = mode === "dub" ? "sub" : "dub";
  m.innerHTML = `<div class="cap">${esc(epCode(sea, ep))}</div>
    ${online && !ok ? "" : `<button class="mi" data-a="playep" data-v="${esc(id)}">${ico("play")}${resumable(ep) ? "Resume" : "Play"}</button>`}
    ${files.length > 1 ? files.map((f, i) => `<button class="mi" data-a="playep" data-v="${esc(id)}" data-ver="${i}">${ico("play")}Play ${esc(f.label)}</button>`).join("") : ""}
    <button class="mi" data-a="mark" data-v="${esc(id)}" data-w="${!ep.watched}">${ico(ep.watched ? "undo" : "check")}${ep.watched ? "Mark as unwatched" : "Mark as watched"}</button>
    ${ep.position ? `<button class="mi" data-a="reset" data-v="${esc(id)}">${ico("undo")}Reset progress</button>` : ""}
    ${ok ? `<button class="mi" data-a="playmode" data-v="${esc(id)}" data-m="${other}">${ico("play")}Play ${other === "dub" ? "dubbed" : "subbed"}</button>` : ""}
    ${ok && !dlJob(id) ? `<button class="mi" data-a="dlep" data-v="${esc(id)}">${ico("download")}Download</button>` : ""}`;
  cmOpener = document.activeElement;
  if (sheetMode()) {
    m.classList.add("sheet");
    m.style.cssText = "display:block";
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
  } else {
    m.classList.remove("sheet");
    m.removeAttribute("role");
    m.removeAttribute("aria-modal");
    m.style.cssText = "";
    m.style.animation = "none"; void m.offsetWidth; m.style.animation = "";
    m.style.cssText += `;display:block;left:${Math.min(x, innerWidth - 250)}px;top:${Math.min(y, innerHeight - 240)}px`;
  }
  (m.querySelector(".mi") || m).focus?.();
}
let cmOpener = null, cmOpenedAt = 0;
function closeCm(skipFocus) {
  const m = $("#cm");
  if (!m || m.style.display === "none" || !m.innerHTML) return false;
  m.style.display = "none"; m.innerHTML = "";
  const o = cmOpener; cmOpener = null;
  if (!skipFocus) o && o.isConnected && o.focus && o.focus();
  return true;
}

/* ---------- overlays ---------- */
const recVal = (side) => { const b = []; if (side?.status) b.push(statusLabel(side.status)); if (side && side.score != null && side.score !== 0) b.push("Score " + side.score); return b.length ? b.join(" · ") : "—"; };
function AniDlg() {
  const a = S.ani || {}, exp = a.expires_at ? new Date(a.expires_at * 1000).toLocaleDateString() : null;
  return `<h2 id="dt">AniList account</h2>
  <p class="sub">${a.connected ? `Connected as <b>${esc(a.user)}</b>${exp ? ` · token expires ${exp}` : ""}` : a.expired ? "The saved token has expired — reconnect below." : "Not connected. Your library runs on local watch state."}</p>
  ${a.connected ? '<div class="bulk"><button class="btn" data-a="aniout">Disconnect</button></div>' : ""}
  ${!a.connected && a.client_id_configured ? '<div class="bulk"><button class="btn pri" data-a="anioauth">Connect via AniList</button></div>' : ""}
  ${!a.connected && location.port !== "8787" ? `<p class="hint-line">The hub runs on port ${esc(location.port || "80")}, but the bundled AniList client redirects to port 8787 — one-click connect needs the hub on its default port, or your own client registered for this port (add <code>anilist_client_id</code> to the config file).</p>` : ""}
  ${!a.connected ? `<p class="hint-line">The browser flow opens anilist.co for one Authorize click. Prefer a token? AniList → Settings → Apps → Create New Token, then paste it below.</p>
    <div class="row" style="margin-top:12px"><input id="tok" type="text" placeholder="…or paste an AniList token" autocomplete="off" spellcheck="false"><button class="btn" data-a="anitoken">Use token</button></div>` : ""}
  <div class="msg" id="animsg"></div>
  <div class="actions"><span></span><button class="btn" data-a="close">Close</button></div>`;
}
function Tour() {
  const T = S.tour, s = S.settings || {}, a = S.ani || {}, n = S.data.shows.length;
  const ok = s.library_root && s.scan?.state === "ok", eps = S.data.shows.reduce((x, y) => x + epTotal(y), 0);
  const b = [
    `<h2 id="dt">Where's your anime?</h2><p class="sub">Anime Hub plays what is in your library folder, in mpv.</p><div class="path">${libPath("tour", s)}${dirBtn("tour")}</div>${DirPick("tour")}
     <div class="found"><i class="dot ${ok ? "ok" : ""}"></i>${ok ? `Found ${n} show${n === 1 ? "" : "s"} · ${eps} episodes` : s.library_root ? "There is a problem with this folder — try another one." : "Choose the folder that holds your anime."}</div>`,
    `<h2 id="dt">Connect AniList?</h2><p class="sub">Your AniList lists become the sections of your library. You can change this later in Settings.</p><div class="choices">
      <button class="choice ${T.choice === "connect" ? "on" : ""}" data-a="tourpick" data-v="connect"><b>Connect AniList</b><span>Sync progress and scores with your account.</span></button>
      <button class="choice ${T.choice === "skip" ? "on" : ""}" data-a="tourpick" data-v="skip"><b>Skip for now</b><span>Everything runs on what is on this device.</span></button></div>`,
    `<h2 id="dt">You're set</h2><p class="sub">${a.connected ? "AniList is connected." : "Running in local mode — connect below, or any time from Settings."}</p>
     <ul class="summary"><li>Library: ${esc(s.library_root || "not configured")}</li><li>mpv ${s.tools?.mpv ? "found" : "not found — install it for playback"}</li><li>AniList: ${a.connected ? "connected" : "not connected"}</li></ul>
     ${!a.connected ? '<button class="btn pri" data-a="tourconnect" style="margin-top:14px">Connect AniList</button>' : ""}
     <div class="${a.connected ? "" : "off"}">${srow("Track episodes", "Publish your highest watched episode after playback.", tgl("auto_progress_sync", "Track episodes", s.auto_progress_sync))}${srow("Add shows automatically", "Add a first-watched show to your list. Off by default.", tgl("auto_add_watch", "Add shows automatically", s.auto_add_watch))}</div>`,
  ][T.step];
  return `<div class="steps">${[0, 1, 2].map((i) => `<i class="${i === T.step ? "on" : i < T.step ? "done" : ""}"></i>`).join("")}</div>${b}
  <div class="actions">${T.step ? '<button class="btn" data-a="tourback">Back</button>' : '<button class="btn" data-a="tourskip">Skip</button>'}<button class="btn pri" data-a="tournext">${T.step === 2 ? "Open library" : "Continue"}</button></div>`;
}
function Rec() {
  const { res, pick } = S.rec, n = res.conflicts.length;
  const facts = res.facts.map((f) => f.kind === "progress" ? `<li>${esc(f.show)} — watch progress synced to EP ${f.local} (was ${f.remote})</li>` : `<li>${esc(f.show)} — episodes up to E${f.remote} marked watched locally</li>`).join("");
  return `<h2 id="dt">${n ? `${n} difference${n === 1 ? "" : "s"} to review` : "AniList connected"}</h2>
  <p class="sub">Watched-episode counts always keep the higher of the two — that part is automatic${facts ? ":" : "."}</p>${facts ? `<ul class="summary">${facts}</ul>` : ""}
  ${n ? `<p class="sub" style="margin-top:14px">These shows differ in list status or score — choose what to keep.</p>
    <div class="bulk"><button class="btn" data-a="recall" data-v="anilist">AniList wins everywhere</button><button class="btn" data-a="recall" data-v="local">Local wins everywhere</button></div>
    <div class="rh"><span>Show</span><span>AniList</span><span>Local</span><span>Keep</span></div>
    ${res.conflicts.map((c) => { const k = pick[c.media_id]; return `<div class="rr"><span class="who"><span><b>${esc(c.title)}</b><small>${esc(c.diff || "")}</small></span></span><span class="v ${k === "anilist" ? "keep" : ""}">${esc(recVal(c.remote))}</span><span class="v ${k === "local" ? "keep" : ""}">${esc(recVal(c.local))}</span>
      <span class="seg" role="group" aria-label="Keep for ${esc(c.title)}"><button class="${k === "anilist" ? "on" : ""}" aria-pressed="${k === "anilist"}" data-a="recset" data-m="${c.media_id}" data-v="anilist">AniList</button><button class="${k === "local" ? "on" : ""}" aria-pressed="${k === "local"}" data-a="recset" data-m="${c.media_id}" data-v="local">Local</button></span></div>`; }).join("")}` : ""}
  <div class="actions"><button class="btn" data-a="recclose">Skip</button><button class="btn pri" data-a="recapply">${n ? `Apply ${n} choice${n === 1 ? "" : "s"}` : "Close"}</button></div>`;
}
function Done() {
  const c = S.modal.c;
  return `<div class="doneico"><svg viewBox="0 0 68 68" aria-hidden="true"><circle class="ring" cx="34" cy="34" r="28"/><path class="tick2" d="M22 35l8 8 16-17"/></svg></div>
  <h2 id="dt">You finished ${esc(c.title || "a show")}</h2><p class="sub">That was the last episode. ${S.ani?.connected ? "This updates your AniList entry." : "Saved on this device only."}</p>
  <dl class="form big"><dt>Status</dt><dd><select id="dn-status" aria-label="Status">${LISTS.map(([v, l]) => `<option value="${v}" ${v === "COMPLETED" ? "selected" : ""}>${l}</option>`).join("")}</select></dd>
  <dt>Score</dt><dd><input id="dn-score" type="number" min="0" max="10" step="1" placeholder="–" aria-label="Score" style="width:90px"> <span class="dim" id="dn-max">/ 10</span></dd>
  <dt>Favourite</dt><dd><button class="heart" id="dn-fav" aria-label="Favourite" aria-pressed="false" data-a="dnfav">${ico("heart")}</button></dd></dl>
  <div class="actions"><button class="btn" data-a="dnskip">Skip</button><button class="btn pri" data-a="dnsave">Save</button></div>`;
}
/* The overlay is built once per dialog; later paints (tour steps, option picks) swap only the dialog body
   so the backdrop and entrance don't replay. Closing fades out before the node is removed. */
function paintModal(focus) {
  const m = S.modal, el = $("#modal");
  if (!m) {
    const o = el.querySelector(".overlay:not(.leave)");
    if (o) { o.classList.add("leave"); setTimeout(() => { if (!S.modal) el.innerHTML = ""; }, 200); }
    return;
  }
  const body = { ani: AniDlg, tour: Tour, rec: Rec, done: Done, src: SrcDlg }[m.t]();
  const cur = el.querySelector(".overlay:not(.leave)");
  if (cur && cur.dataset.t === m.t) {
    const dlg = cur.querySelector(".dialog");
    dlg.innerHTML = body;
    dlg.classList.remove("swap"); void dlg.offsetWidth;
    if (!reduceMotion()) dlg.classList.add("swap");
  } else {
    el.innerHTML = `<div class="overlay" data-t="${m.t}" ${m.t === "tour" ? "" : 'data-a="scrim"'}><div class="dialog ${m.t === "rec" ? "rec" : ""}" role="dialog" aria-modal="true" aria-labelledby="dt" tabindex="-1">${body}</div></div>`;
  }
  if (focus) (el.querySelector(".pri") || el.querySelector("input") || el.querySelector(".dialog")).focus();
}
function openModal(m) { S.menu = null; S.opener = document.activeElement; S.modal = m; paintNav(); paintModal(true); }
function closeModal() { S.modal = null; paintModal(); S.opener && S.opener.isConnected && S.opener.focus(); }
function confetti() {
  if (reduceMotion()) return;
  const f = $("#fx"), c = ["var(--accent)", "var(--accent-hi)", "var(--ok)", "var(--warn)", "var(--ink)"];
  f.innerHTML = Array.from({ length: 34 }, (_, i) => `<i class="cf" style="left:${35 + Math.random() * 30}%;top:30%;background:${c[i % 5]};border-radius:${i % 3 === 0 ? "50%" : "2px"};--dx:${(Math.random() - 0.5) * 680}px;--rot:${Math.random() * 720}deg;animation-delay:${Math.random() * 0.2}s"></i>`).join("");
  setTimeout(() => (f.innerHTML = ""), 2400);
}
/* Small radial pop of dots from an element (favourite hearts). */
function burstAt(el) {
  if (!el || reduceMotion()) return;
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, f = $("#fx");
  for (let i = 0; i < 10; i++) {
    const p = document.createElement("i"), a = (i / 10) * Math.PI * 2, d = 26 + Math.random() * 16;
    p.className = "bp";
    p.style.cssText = `left:${cx - 3}px;top:${cy - 3}px;background:${i % 2 ? "#e0788a" : "var(--accent-hi)"}`;
    f.appendChild(p);
    p.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(0)`, opacity: 0 }],
      { duration: 600 + Math.random() * 200, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = () => p.remove();
  }
}

/* ---------- AniList account, reconcile, completion, tour ---------- */
async function aniStatusRefresh() {
  try { S.ani = await api("/api/auth/status"); } catch { S.ani = { connected: false }; }
  paintNav();
  if (S.ani.connected) maybeReconcile();
}
const setMsg = (t) => { const m = $("#animsg"); if (m) m.textContent = t; };
function maybeReconcile() {
  if (S.rec) return;
  api("/api/reconcile", {}).then((res) => { /* POST-only route: a GET is a 404 */
    if (!res || !res.pending) return;
    if (!res.conflicts.length && !res.facts.length) { api("/api/reconcile/dismiss", {}).catch(() => {}); return; }
    if (S.modal) return; // retried on the next refresh
    S.rec = { res, pick: Object.fromEntries(res.conflicts.map((c) => [c.media_id, "anilist"])) };
    openModal({ t: "rec" });
  }).catch(() => {});
}
function recDone() { api("/api/reconcile/dismiss", {}).catch(() => {}); S.rec = null; closeModal(); reload(); }
let lastCompletionKey = null;
function maybeCompletion(c) {
  const key = `${c.media_id}:${c.count}`;
  if (key === lastCompletionKey || S.modal) return;
  lastCompletionKey = key;
  openModal({ t: "done", c });
  confetti();
  api("/api/entry?id=" + c.media_id).then((res) => {
    if (!res || res.error || !res.state || S.modal?.t !== "done") return;
    const st = res.state, e = st.entry || {}, max = st.score_max || 10;
    const sc = $("#dn-score");
    sc.max = max; sc.step = (st.score_format || "").includes("DECIMAL") ? 0.1 : 1; $("#dn-max").textContent = "/ " + max;
    if (e.score != null) sc.value = e.score;
    if (LISTS.some(([v]) => v === e.status)) $("#dn-status").value = e.status;
    if (st.is_favourite) { const f = $("#dn-fav"); f.classList.add("on"); f.setAttribute("aria-pressed", "true"); }
  }).catch(() => {});
}
function finishTour(skipped) {
  api("/api/settings", { tour_done: true }).catch(() => {});
  if (S.settings) S.settings.tour_done = true;
  closeModal();
  if (!skipped) nav("library");
}
function maybeTour() {
  if (!S.settings || S.settings.tour_done || location.hash.includes("#show=") || S.modal) return;
  S.tour = { step: 0, choice: "connect" };
  openModal({ t: "tour" });
}
async function openExternal(url) {
  try { const r = await api("/api/open", { url }); if (!r.ok) throw 0; } catch { window.open(url, "_blank", "noopener"); }
}

/* Wait for the OAuth callback bridge to report a connection (both the
   browser-tab flow and the shell flow's "approve in your browser" path). */
async function pollOauth() {
  for (let i = 0; i < 150 && S.modal?.t === "ani"; i++) {
    await sleep(2000);
    if (S.modal?.t !== "ani") return;
    const st = await api("/api/auth/status").catch(() => null);
    if (st?.connected) { S.ani = st; S.alData = null; toast(`AniList connected as ${st.user}`); closeModal(); aniStatusRefresh(); setTimeout(reload, 2500); return; }
  }
  if (S.modal?.t === "ani") setMsg("Still not connected — the AniList tab may have been closed. Try again, or paste a token below.");
}

/* ---------- render ---------- */
let io = null;
function applyBg(el) {
  const u = el.dataset.bg;
  delete el.dataset.bg;
  if (!u) return;
  el.style.backgroundImage = cssUrl(u);
  el.style.backgroundPosition = el.dataset.bp || "center";
}
function lazyBg() {
  const els = $$("[data-bg]");
  if (!("IntersectionObserver" in window)) { els.forEach(applyBg); return; }
  io ||= new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { io.unobserve(en.target); applyBg(en.target); } }), { rootMargin: "300px 0px" });
  els.forEach((el) => io.observe(el));
}
const saveLib = () => lsSet("hubLib", S.lib);
let fIdx = -1;
const glideMem = {};
/* A single indicator element that slides between the active items of a [data-glide] box.
   The box is rebuilt on every paint, so the indicator is re-created at the remembered
   position first and then moved: the transition runs even though the DOM is new. */
function glide(box) {
  const on = box.querySelector(".on,[aria-current]");
  if (!on) return;
  const key = box.dataset.glide;
  let g = box.querySelector(":scope > .glide");
  if (!g) { g = document.createElement("i"); g.className = "glide"; box.prepend(g); }
  const to = { x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight };
  const set = (r) => { g.style.setProperty("--gx", r.x + "px"); g.style.setProperty("--gy", r.y + "px"); g.style.setProperty("--gw", r.w + "px"); g.style.setProperty("--gh", r.h + "px"); };
  const from = glideMem[key];
  if (from && !reduceMotion()) { g.style.transition = "none"; set(from); void g.offsetWidth; g.style.transition = ""; }
  set(to); glideMem[key] = to;
}
/* Edge fades + arrow state for horizontally scrolling strips. */
function strips() {
  $$("#app .strip").forEach((st) => {
    const arrows = st.previousElementSibling ? st.previousElementSibling.querySelectorAll(".arr") : [];
    const upd = () => {
      const max = st.scrollWidth - st.clientWidth, x = st.scrollLeft;
      st.classList.toggle("ml", x > 4); st.classList.toggle("mr", x < max - 4);
      if (arrows[0]) { arrows[0].hidden = arrows[1].hidden = max <= 4; arrows[0].disabled = x <= 4; arrows[1].disabled = x >= max - 4; }
    };
    st.addEventListener("scroll", upd, { passive: true }); upd();
  });
}
/* The detail page is lit by its artwork: sample a mid-tone from the poster and feed it to --amb
   (faint backdrop glow + poster shadow). Fixed saturation/lightness keeps every show tasteful. */
const ambMemo = {};
let ambWant = null;
function sampleColor(img) {
  const w = 24, h = 36, c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  let R = 0, G = 0, B = 0, W = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    const s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1)), wt = s * s * (1 - Math.abs(2 * l - 1)) + 0.001;
    R += r * wt; G += g * wt; B += b * wt; W += wt;
  }
  R /= W; G /= W; B /= W;
  const mx = Math.max(R, G, B), dl = mx - Math.min(R, G, B);
  let hh = 0;
  if (dl) hh = (mx === R ? (G - B) / dl + (G < B ? 6 : 0) : mx === G ? (B - R) / dl + 2 : (R - G) / dl + 4) * 60;
  return `hsl(${Math.round(hh)} 46% 52%)`;
}
function ambient() {
  const root = document.documentElement;
  const url = S.view === "show" ? (showById(S.showId)?.poster || showById(S.showId)?.banner) : null;
  ambWant = url || null;
  const set = (c) => (c ? root.style.setProperty("--amb", c) : root.style.removeProperty("--amb"));
  if (!url) return set(null);
  if (url in ambMemo) return set(ambMemo[url]);
  const img = new Image();
  img.onload = () => { let c = null; try { c = sampleColor(img); } catch {} ambMemo[url] = c; if (ambWant === url) set(c); };
  img.src = url;
}
function countUp() {
  if (reduceMotion()) return;
  $$("#app .tile b[data-n]").forEach((b, k) => {
    const to = +b.dataset.n, dec = +b.dataset.d || 0, suf = b.dataset.s || "", t0 = performance.now() + k * 90;
    const step = (now) => {
      const p = Math.min(1, Math.max(0, (now - t0) / 1000));
      b.textContent = (to * (1 - Math.pow(1 - p, 4))).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    b.textContent = (0).toFixed(dec) + suf; requestAnimationFrame(step);
  });
}
const VIEW_TITLE = { home: "", library: "Library", history: "History", stats: "Stats", settings: "Settings" };
function render() {
  if (S.view === "show" && !showById(S.showId)) S.view = "home";
  const fresh = S.navIn; S.navIn = false; // entrance choreography belongs to navigation, not to every re-render
  if (fresh) for (const k in glideMem) if (k !== "nav") delete glideMem[k];
  paintNav();
  io && io.disconnect();
  const app = $("#app");
  app.classList.toggle("nav-in", fresh && !reduceMotion());
  app.innerHTML = { home: Home, library: Lib, history: Hist, stats: Stats, settings: Sett, show: Det }[S.view]();
  if (S.view === "library") { paintWall(S.fadeNext); S.fadeNext = false; startMetaWatch(); }
  lazyBg();
  $$("#app [data-glide]").forEach(glide);
  strips(); ambient();
  if (fresh || S.countNext) { S.countNext = false; countUp(); }
  const t = S.view === "show" ? showById(S.showId)?.title : VIEW_TITLE[S.view];
  document.title = t ? `${t} · Anime Hub` : "Anime Hub";
  if (S.view === "show") { const id = showById(S.showId).meta?.anilist_id; if (id) loadEntry(id); }
  if (S.view === "show") { streamFreshen(showById(S.showId)); resolveHome(showById(S.showId)); }
  if (S.view === "stats") loadAlData();
  applyFocus();
}
/* Airing releases gain episodes: a stale ani-cli list is re-asked once per visit. */
const freshening = new Set();
function streamFreshen(s) {
  if (!isStream(s) || !s.stream.stale || freshening.has(s.id)) return;
  freshening.add(s.id);
  api("/api/stream/refresh", { media_id: s.meta.anilist_id }).then(async (r) => {
    if (!r || r.error || !r.added) return;
    await refreshData();
    if (S.view === "show" && S.showId === s.id) softRender();
  }).catch(() => {});
}
/* Background refreshes must not clobber a field the user is typing in. */
function softRender() {
  const a = document.activeElement;
  if (a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) && a.closest("#app")) { S.stale = true; return; }
  render();
}
document.addEventListener("focusout", () => setTimeout(() => {
  const a = document.activeElement;
  if (S.stale && !(a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) && a.closest("#app"))) { S.stale = false; render(); }
}, 80));
function dip(f) {
  const a = $("#app");
  if (reduceMotion()) return f();
  a.classList.add("out");
  setTimeout(() => { f(); a.classList.remove("out"); a.classList.remove("enter"); void a.offsetWidth; a.classList.add("enter"); }, 200);
}
function clearSearch() { S.q = ""; S.alres = null; S.alq = null; S.alBusy = false; S.menu = null; $("#q").value = ""; }
function nav(view, fn) {
  dip(() => {
    const prev = S.view;
    S.navIn = true; S.view = view; clearSearch(); fIdx = -1;
    if (view === "library") S.fadeNext = true;
    if (fn) fn(prev);
    render(); scrollTo(0, 0); pushNav();
  });
}
function openShow(id) {
  nav("show", (prev) => {
    if (prev !== "show") S.showBack = prev;
    S.showId = id;
    const s = showById(id), t = s && pickTarget(s);
    S.seasonIdx = t ? Math.max(0, s.seasons.indexOf(t.sea)) : 0;
  });
}

/* ---------- data refresh + polling ---------- */
let reloading = false, metaWatch = null, nowTimer = null, lastNowError = null, lastNotice = null;
function offlineNote(on, msg) {
  let n = $(".offlinenote");
  if (!on) { n && n.remove(); return; }
  if (!n) { n = document.createElement("div"); n.className = "offlinenote"; document.body.appendChild(n); }
  n.textContent = msg;
}
/* Fetching and drawing fail for different reasons, so they are reported
   separately: only a failed fetch means "can't reach the hub". */
async function reload() {
  if (reloading) return;
  reloading = true;
  let d;
  try { d = await api("/api/library"); }
  catch (e) { return retryLoad(`Can't reach the hub (${e.message}) — retrying…`); }
  if (!d || d.error || !Array.isArray(d.shows)) return retryLoad(`The hub answered, but not with a library${d && d.error ? ": " + d.error : ""} — retrying…`);
  S.data = d; offlineNote(false);
  try { softRender(); }
  catch (e) { console.error(e); offlineNote(true, `Display error: ${e.message} (see the browser console)`); }
  reloading = false;
}
function retryLoad(msg) { offlineNote(true, msg); setTimeout(() => { reloading = false; reload(); }, 4000); }
/* Watch-state changes (mark / bulk / reset) patch the show page in place
   instead of rebuilding #app: a rebuild recreates every image element — the
   episode tiles lose their background for a frame or two and the hero poster
   <img> reloads — just to flip a tick (Elias, 2026-10-17). Only text/state
   bits move; artwork DOM nodes stay where they are. */
function patchShow() {
  const cur = $("#app"), fresh = document.createElement("div");
  fresh.innerHTML = Det();
  /* State-bearing, image-free subtrees swap wholesale. */
  for (const sel of [".hero .cta", ".eps-head .ctl", ".rels"]) {
    const a = cur.querySelector(sel), b = fresh.querySelector(sel);
    if (a && b) a.replaceWith(b);
    else if (a && !b) a.remove();
  }
  if (cur.querySelector(".rels")) glide(cur.querySelector(".rels")); // the glide indicator is re-created on swap
  /* The now-playing badge (Loading → Playing) sits beside the art-free
     chips; only it moves — #airline keeps the text entryDraw put there. */
  const pa = cur.querySelector(".hero .meta .playing"), pb = fresh.querySelector(".hero .meta .playing");
  if (pa && pb) pa.replaceWith(pb); else if (pa) pa.remove(); else if (pb) cur.querySelector(".hero .meta")?.prepend(pb);
  /* Episode tiles: the art-bearing .epimg child is watch-independent, so the
     node itself survives — only the class and the state children follow the
     watch state. Swapping the art node out would blank the tile until the
     lazy observer re-applies the background. */
  const next = new Map([...fresh.querySelectorAll(".ep[data-v]")].map((el) => [el.dataset.v, el]));
  for (const tile of cur.querySelectorAll(".ep[data-v]")) {
    const el = next.get(tile.dataset.v);
    if (!el) continue;
    const art = tile.querySelector(":scope > .epimg");
    tile.className = el.className;
    tile.innerHTML = el.innerHTML;
    if (art) tile.querySelector(":scope > .epimg")?.replaceWith(art);
  }
  /* Keep keyboard focus on the control that acted (its node may be new). */
  const ae = document.activeElement;
  const key = ae && ae.closest ? ae.closest("#app [data-a]") : null;
  if (key) {
    const q = [`[data-a="${key.dataset.a}"]`];
    for (const k of ["v", "s"]) if (key.dataset[k] != null) q.push(`[data-${k}="${key.dataset[k].replace(/"/g, '\\"')}"]`);
    const again = cur.querySelector(q.join(""));
    if (again) again.focus({ preventScroll: true });
  }
  applyFocus();
}
function watchPatch(ids, watched, reset) {
  applyWatch(allShows(), ids, watched, reset);
  if (S.view === "show" && showById(S.showId)) {
    patchShow();
    const id = showById(S.showId).meta?.anilist_id;
    if (id) loadEntry(id);
    /* Other views read continue/history/stats off S.data — refresh it in the
       background without touching this page's DOM. */
    refreshData();
    return;
  }
  reload();
}
async function refreshData() { try { S.data = await api("/api/library"); paintNav(); } catch {} }
function startMetaWatch() {
  if (metaWatch || !S.data?.meta_running) return;
  metaWatch = setTimeout(metaTick, 2500);
}
function metaTick() {
  api("/api/library").then((d) => {
    if (!d) { metaWatch = null; return; }
    S.data = d;
    if (S.view === "library") { const n = $(".metanote span"); if (n && d.meta_running) n.textContent = metaText(d); }
    if (d.meta_running) metaWatch = setTimeout(metaTick, 2500);
    else { metaWatch = null; softRender(); } // final settle: posters flip in
  }).catch(() => { metaWatch = null; });
}
function pollSoon(ms) { if (nowTimer) clearTimeout(nowTimer); nowTimer = setTimeout(pollNow, ms); }
async function pollNow() {
  nowTimer = null;
  try {
    const now = await api("/api/now");
    if (now.error && now.error !== lastNowError) { lastNowError = now.error; toast(now.error); } else if (!now.error) lastNowError = null;
    const was = !!S.data?.now, prevEp = S.data?.now?.episode_id;
    const outbox = typeof now.outbox === "number" ? now.outbox : 0;
    if (now.notice && now.notice.ts !== lastNotice) { lastNotice = now.notice.ts; toast(now.notice.msg); }
    if (!S.playBusy) {
      const nl = now.playing && now.loading ? now.episode_id : null;
      if (nl !== S.loadingEp) { S.loadingEp = nl; if (S.view === "show" && showById(S.showId) && was === now.playing) patchShow(); }
    }
    if (was !== now.playing) await reload();
    else if (now.playing) {
      const wasLoading = !!S.data.now?.loading;
      S.data.now = { episode_id: now.episode_id, show: now.show, label: now.label, percent: now.percent, loading: !!now.loading };
      if (wasLoading !== !!now.loading && S.view === "show" && showById(S.showId)) patchShow();
      if (prevEp && prevEp !== now.episode_id) await reload(); // autoplay moved on: refresh ticks / next-up
    }
    if (outbox !== S.outbox) S.outbox = outbox;
    const dls = now.downloads || [], done = (l) => l.filter((j) => j.status === "done").length;
    const finished = done(dls) > done(S.dl);
    const dlChanged = JSON.stringify(dls) !== JSON.stringify(S.dl);
    S.dl = dls;
    if (finished) await reload(); // a finished download is a new file on disk
    else if (dlChanged && S.view === "show" && showById(S.showId)) patchShow(); // progress on the tiles
    const sig = JSON.stringify([S.data?.now, S.outbox, S.dl]);
    if (sig !== navSig) { navSig = sig; paintNav(); }
    if (now.completed) maybeCompletion(now.completed);
  } catch {}
  pollSoon(S.dl.some((j) => j.status === "running") ? 2000 : 4000);
}
/* Online episodes take a few seconds to start: the tile (and the hero
   button) show it loading until mpv reports playback. */
function markLoading(id) {
  S.loadingEp = id;
  if (S.view === "show" && showById(S.showId)) patchShow();
}
async function play(id, version = 0, mode) {
  const online = id.startsWith("stream:");
  S.playBusy = true;
  if (online) markLoading(id);
  const body = { id, version };
  if (mode) body.mode = mode;
  const res = await api("/api/play", body).catch(() => ({ error: "Could not reach the hub." }));
  S.playBusy = false;
  if (res.error) { markLoading(null); toast(res.error); }
  else if (!online) toast("Launching mpv…");
  pollSoon(600);
}
/* Queue ani-cli downloads; they land in the library folder as ordinary files. */
async function download(mid, eps) {
  const r = await api("/api/download", { media_id: mid, episodes: eps }).catch(() => null);
  if (!r || r.error) return toast(r?.error || "Could not reach the hub.");
  toast(r.queued ? `Downloading ${r.queued} episode${r.queued === 1 ? "" : "s"}` : "Already downloaded or downloading");
  pollSoon(300);
}
async function setToggle(key, on) {
  const r = await api("/api/settings", { [key]: on }).catch(() => null);
  if (!r || r.error) { toast(r?.error || "Could not save — is the hub running?"); return; }
  S.settings = r;
  if (S.view === "settings") render();
  if (S.modal?.t === "tour") paintModal();
}
function commitMatch(id, aid) {
  const m = mst(id);
  m.busy = true; m.err = ""; paintMatch(id);
  api("/api/match", { show_id: id, anilist_id: aid }).then((r) => {
    m.busy = false;
    if (r && r.error) { m.err = r.error; paintMatch(id); return; }
    delete S.match[id];
    toast(`Matched to AniList #${aid}`);
    reload();
  }).catch(() => { m.busy = false; m.err = "Could not save — is the hub running?"; paintMatch(id); });
}

/* ---------- actions ---------- */
const A = {
  strip: (v, t) => { const st = $("#app .strip"); st && st.scrollBy({ left: +t.dataset.d * st.clientWidth * 0.8, behavior: reduceMotion() ? "auto" : "smooth" }); },
  fclear: () => { for (const k of ["fmt", "air", "year", "score"]) S.lib[k] = "all"; if (!srcLocked()) S.lib.src = "all"; saveLib(); S.fadeNext = true; render(); },
  go: (v) => nav(v), open: (v) => openShow(v), back: () => nav(VIEWS.includes(S.showBack) ? S.showBack : "home"),
  entry: (v) => {
    const e = S.data.spine?.entries.find((x) => String(x.id) === v);
    if (!e) return;
    const sid = e.local_show_id || (showById(e.stream_show_id) ? e.stream_show_id : null);
    sid ? openShow(sid) : openRelease(e.id, hintFromEntry(e));
  },
  tab: (v) => { S.lib.tab = v; saveLib(); S.fadeNext = true; render(); },
  filt: (v, t) => { S.lib[t.dataset.k] = v; saveLib(); paintWall(); syncFilters(); },
  hrange: (v) => { S.histRange = v; S.histMax = 120; lsSet("histRange", v); render(); },
  histmore: () => { S.histMax += 200; render(); },
  play: (v) => play(v), playep: (v, t) => play(v, +t.dataset.ver || 0),
  cm: (v, t, e) => openCm(v, e.clientX, e.clientY),
  mark: (v, t) => {
    const w = t.dataset.w === "true";
    api("/api/watched", { id: v, watched: w }).then((r) => { if (r && r.error) return toast(r.error); toast(w ? "Marked as watched" : "Marked as unwatched"); watchPatch([v], w, false); }).catch(() => toast("Could not save — is the hub running?"));
  },
  reset: (v) => { api("/api/reset", { id: v }).then(() => { toast("Progress reset"); watchPatch([v], false, true); }).catch(() => toast("Could not save — is the hub running?")); },
  bulk: (v, t) => {
    const w = t.dataset.w === "true", body = { show_id: S.showId, watched: w };
    if (t.dataset.s !== "") body.season = +t.dataset.s;
    api("/api/bulk-watched", body).then((r) => {
      if (r && r.error) return toast(r.error);
      toast(w ? `Marked ${r.episodes} episode${r.episodes === 1 ? "" : "s"} watched${r.synced ? " — will sync" : ""}` : `Removed watched marks from ${r.episodes} episode${r.episodes === 1 ? "" : "s"}`);
      const s = showById(S.showId);
      const seas = t.dataset.s === "" ? s.seasons : [s.seasons[+t.dataset.s]];
      watchPatch(seas.flatMap((x) => x.episodes.map((e) => e.id)), w, false);
    }).catch(() => toast("Could not save — is the hub running?"));
  },
  season: (v) => { S.seasonIdx = +v; render(); },
  zoomin: () => zoomSet(zoomStep(zoomGet(), 1)),
  zoomout: () => zoomSet(zoomStep(zoomGet(), -1)),
  /* PWA install (Settings → App, and the install bar). */
  install: () => {
    const o = installOffer();
    if (o?.kind === "prompt") doInstall();
    else if (o?.kind === "ios") toast("Open Share, then “Add to Home Screen”.");
    else toast("This browser can't install apps — try Chrome, Edge or Android.");
  },
  installhow: () => toast("Chrome/Edge/Android: use the Install button (or the address bar). iPhone/iPad: Share → Add to Home Screen."),
  /* online episodes (ani-cli) */
  srcfix: () => { const s = showById(S.showId); if (s?.meta?.anilist_id) openSrc(s); },
  slsearch: () => { const text = ($("#slq")?.value || "").trim(); if (text && S.modal?.t === "src") slSearch(S.modal.mid, text, []); },
  slpick: (v) => { const st = slst(S.modal.mid); st.pick = +v; paintModal(); },
  sllink: async () => {
    const mid = S.modal.mid, st = slst(mid), r = st.res?.[st.pick];
    if (!r || st.busy) return;
    st.busy = "Loading its episodes…"; st.err = ""; paintModal();
    const res = await api("/api/stream/link", { media_id: mid, query: st.q, title: r.title, index: r.index, display: S.modal.title }).catch(() => null);
    st.busy = "";
    if (!res || res.error) { st.err = res?.error || "Could not reach the hub."; paintModal(); return; }
    delete S.slink[mid];
    closeModal();
    toast("Episodes updated");
    await refreshData();
    delete S.releases[mid];
    if (S.view === "show") render();
  },
  playmode: (v, t) => play(v, 0, t.dataset.m),
  unavail: () => toast(S.data.stream_ready ? "This episode isn't available to watch online." : "Install ani-cli to watch this online."),
  dlep: (v) => { const [, mid, ep] = v.split(":"); download(+mid, [ep]); },
  dlmany: (v, t) => download(+v, JSON.parse(t.dataset.eps || "[]")),
  dlcancel: (v) => { api("/api/download/cancel", { id: +v }).then(() => pollSoon(200)).catch(() => {}); },
  dlclear: () => { api("/api/download/clear", {}).then(() => { S.dl = S.dl.filter((j) => j.status === "running" || j.status === "queued"); paintNav(); }).catch(() => {}); },
  spref: (v, t) => {
    api("/api/settings", { [t.dataset.k]: v }).then((r) => {
      if (!r || r.error) return toast(r?.error || "Could not save — is the hub running?");
      S.settings = r; if (S.view === "settings") render();
    }).catch(() => toast("Could not save — is the hub running?"));
  },
  sync: () => toast("Changes are saved locally and will sync to AniList when the connection returns."),
  ext: (v, t, e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; e.preventDefault(); openExternal(v); },
  menu: (v) => { S.menu = S.menu === v ? null : v; paintNav(); },
  rescan: (v, t) => { if (t.disabled) return; t.disabled = true; t.classList.add("busy"); api("/api/refresh", {}).catch(() => {}); toast("Rescanning + fetching metadata…"); setTimeout(() => { reload(); }, 2500); },
  adopt: (v, t) => { t.disabled = true; api("/api/adopt-root", {}).then((r) => { if (!r.ok) { toast(r.error || "Could not connect the folder."); t.disabled = false; return; } toast("Library folder connected."); loadSettings().then(reload); }).catch(() => { t.disabled = false; }); },
  alsearch: async () => {
    S.alq = S.q.trim(); S.alBusy = true; paintNav();
    try { const r = await api("/api/match-candidates", { query: S.alq }); if (r && r.error) { toast(r.error); S.alres = []; } else S.alres = r || []; }
    catch { toast("AniList search failed — is the hub running?"); S.alres = []; }
    S.alBusy = false; if (S.q.trim() === S.alq) paintNav();
  },
  catpick: (v) => {
    const x = S.alres[+v];
    if (!x) return;
    openRelease(x.id, hintFromCand(x));
  },
  /* AniList entry panel */
  eset: (v, t) => {
    const k = t.dataset.k;
    if (k === "status") { if (v) entryPatch({ status: v }); return; }
    if (k === "score") { const n = parseFloat(v), max = S.entry?.f?.score_max || 10; if (Number.isNaN(n)) return; entryPatch({ score: Math.max(0, Math.min(max, n)) }); return; }
    entryPatch({ [k]: String(v).trim() });
  },
  ebump: (v, t) => {
    const k = t.dataset.k, f = S.entry?.f;
    if (!f) return;
    let n = Math.max(0, (f[k === "progress" ? "progress" : "repeat"] ?? 0) + +t.dataset.d);
    const cap = f.media?.episodes;
    if (k === "progress" && cap) n = Math.min(n, cap);
    entryPatch({ [k === "progress" ? "progress" : "repeat"]: n });
  },
  efav: () => { if (S.entry?.f) entryPatch(undefined, !S.entry.f.favourite); },
  /* match repair */
  pick: (v, t) => { const id = t.dataset.s; mst(id).pick = +v; paintMatch(id); },
  msearch: (v) => {
    const input = $(`#mq-${CSS.escape(v)}`), text = (input?.value || "").trim(), m = mst(v);
    m.q = text;
    if (!text) return;
    const hit = text.match(/anilist\.co\/anime\/(\d+)/) || text.match(/^(\d+)$/);
    hit ? commitMatch(v, +hit[1]) : runSearch(v, text);
  },
  match: (v) => { const m = mst(v), c = (m.cands || [])[m.pick]; if (c) commitMatch(v, c.id); },
  keeplocal: () => toast("Kept local — you can match it later"),
  /* settings + account */
  adv: (v) => { if (S.settings) setToggle(v, !S.settings[v]); },
  ani: () => openModal({ t: "ani" }),
  aniout: async () => {
    await api("/api/auth/logout", {}).catch(() => {});
    toast("AniList disconnected"); S.alData = null; closeModal(); await aniStatusRefresh(); reload();
  },
  anitoken: async (v, t) => {
    const tok = ($("#tok")?.value || "").trim();
    if (!tok) return;
    t.disabled = true;
    const r = await api("/api/auth/token", { token: tok }).catch(() => null);
    t.disabled = false;
    if (!r || r.error) return setMsg(r?.error || "Could not reach the hub.");
    toast(`AniList connected as ${r.user}`); S.alData = null; closeModal(); aniStatusRefresh(); setTimeout(reload, 2500);
  },
  anioauth: async () => {
    /* Open the tab inside the click so the browser keeps popup permission.
       In shell mode window.open would spawn a SECOND app window showing
       anilist.co — send the authorize URL to the system browser instead. */
    if (SHELL) {
      const r0 = await api("/api/auth/start", {}).catch(() => null);
      if (!r0 || r0.error) return setMsg(r0?.error || "Could not reach the hub.");
      openExternal(r0.url);
      setMsg("Waiting for AniList — approve in your browser…");
      return pollOauth();
    }
    const win = window.open("about:blank", "_blank");
    if (win) win.opener = null; // anilist.co gets no handle on this window
    let r = null;
    try { r = await api("/api/auth/start", {}); } catch {}
    if (!r || r.error) { win?.close(); return setMsg(r?.error || "Could not reach the hub."); }
    if (win) { win.location = r.url; setMsg("Waiting for AniList — approve in the tab that opened…"); }
    else { const m = $("#animsg"); if (m) m.innerHTML = `Popup blocked — <a href="${esc(r.url)}" target="_blank" rel="noopener">open AniList</a> to continue.`; }
    return pollOauth();
  },
  tour: async () => { if (!S.settings) await loadSettings(); S.tour = { step: 0, choice: "connect" }; S.dir = null; openModal({ t: "tour" }); },
  dirbrowse: (v, t) => {
    const ctx = t.closest(".dialog") ? "tour" : "settings", typed = ($("#libpath-" + ctx)?.value || "").trim(), field = t.tagName === "INPUT";
    if (S.dir?.ctx === ctx) { if (field) dirGo(typed); else dirClose(); return; } // Browse again = Cancel; Enter in the field walks there
    S.dir = { ctx, dirs: null };
    paintDir(ctx);
    dirGo(typed || S.settings?.library_root || "");
  },
  dirgo: (v) => dirGo(v),
  dirclose: () => dirClose(),
  diruse: () => {
    const p = S.dir, cur = S.settings?.library_root;
    if (!p?.path) return;
    if (cur && cur !== p.path) { p.confirm = true; paintDir(); return; } // switching an indexed root is a confirmed step (Decision 23.7)
    dirSet(p.path);
  },
  dirconfirm: (v) => { if (v === "1") dirSet(S.dir.path); else { S.dir.confirm = false; paintDir(); } },
  tourpick: (v) => { S.tour.choice = v; paintModal(); }, tourback: () => { S.tour.step--; paintModal(true); },
  tourskip: () => finishTour(true),
  tournext: () => {
    const T = S.tour;
    if (T.step < 2) { T.step++; return paintModal(true); }
    finishTour(false);
  },
  /* Page 3's Connect: finish the tour first (so bailing out of the AniList
     dialog never re-nags), then hand off to the connect dialog. Found by
     Elias: choosing connect on page 2 skipped page 3 entirely — the old
     handoff closed the tour before the summary ever showed. */
  tourconnect: () => { api("/api/settings", { tour_done: true }).catch(() => {}); if (S.settings) S.settings.tour_done = true; closeModal(); openModal({ t: "ani" }); },
  recset: (v, t) => { S.rec.pick[t.dataset.m] = v; paintModal(); },
  recall: (v) => { for (const k of Object.keys(S.rec.pick)) S.rec.pick[k] = v; paintModal(); },
  recclose: () => recDone(),
  recapply: () => {
    const list = Object.entries(S.rec.pick).map(([m, w]) => ({ media_id: Number(m), winner: w }));
    api("/api/reconcile/apply", { decisions: list }).then((r) => {
      if (r && r.error) return toast(r.error);
      toast(`Reconciled — ${r.applied ?? list.length} shows updated`);
      S.rec = null; S.alData = null; closeModal(); reload(); setTimeout(reload, 3000);
    }).catch(() => toast("Could not apply — is the hub running?"));
  },
  dnfav: (v, t) => { const on = !t.classList.contains("on"); t.classList.toggle("on", on); t.classList.add("pop1"); if (on) burstAt(t); t.setAttribute("aria-pressed", on); },
  dnskip: () => { const c = S.modal.c; api("/api/completion-seen", { media_id: c.media_id, count: c.count }).catch(() => {}); closeModal(); },
  dnsave: (v, t) => {
    const c = S.modal.c, patch = { status: $("#dn-status").value }, sc = $("#dn-score").value;
    if (sc !== "") patch.score = parseFloat(sc);
    t.disabled = true;
    entrySave(c.media_id, patch, $("#dn-fav").classList.contains("on")).then((res) => {
      if (res && res.error) { toast(res.error); t.disabled = false; return; }
      toast(res && res.queued ? "Saved — will sync when AniList is reachable" : "Saved");
      api("/api/completion-seen", { media_id: c.media_id, count: c.count }).catch(() => {});
      closeModal(); refreshData();
    }).catch(() => { toast("Could not save — is the hub running?"); t.disabled = false; });
  },
  close: () => closeModal(), scrim: (v, t, e) => { if (e.target === t) S.modal?.t === "done" ? A.dnskip() : closeModal(); }, /* a backdrop dismissal is a Skip (Decision 25: once per event) */
};

/* ---------- events ---------- */
const isField = (t) => /^(SELECT|INPUT)$/.test(t.tagName);
document.addEventListener("click", (e) => {
  /* Resolve the action target before closing the menu: closing empties #cm,
     which would detach the very button that was just pressed. Focus is only
     restored when the press was *not* a menu action (a menu item's own
     action should take focus, not the tile that opened the menu). */
  const t = e.target.closest("[data-a]");
  closeCm(!!t);
  if (S.menu && !e.target.closest(".rel,.search")) { S.menu = null; paintNav(); }
  if (t && !t.disabled && !isField(t) && A[t.dataset.a]) A[t.dataset.a](t.dataset.v, t, e);
});
document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-a]");
  if (t && isField(t) && A[t.dataset.a]) A[t.dataset.a](t.value, t, e);
});
document.addEventListener("contextmenu", (e) => {
  const ep = e.target.closest(".ep[data-a=playep]");
  if (ep) { e.preventDefault(); openCm(ep.dataset.v, e.clientX, e.clientY); }
});
/* Desktop-shell mode (the anime-hub wrapper opens the UI with ?shell=1):
   suppress the browser's own chrome so the window reads as an app, not a
   browser — no page zoom (ctrl+wheel / ctrl±) and no default context menu
   outside the app's own episode menu. A plain browser tab (no ?shell) keeps
   every normal browser behavior. */
const SHELL = new URLSearchParams(location.search).has("shell");
/* UI zoom preference: applied at boot (before first paint of the UI), shown
   and changed only in Settings → Appearance (Elias: no zoom shortcuts —
   ctrl+scroll / ctrl± stay dead in shell mode, they just must not trigger
   browser zoom). */
const zoomGet = () => { const v = lsGet("hubZoom", 100); return typeof v === "number" && v >= ZOOM_MIN && v <= ZOOM_MAX ? Math.round(v) : 100; };
function applyZoom() { document.documentElement.style.zoom = zoomGet() / 100; }
function zoomSet(z) { lsSet("hubZoom", z); applyZoom(); const el = $("#zoomval"); if (el) el.textContent = z + "%"; }
if (SHELL) {
  /* Browser zoom stays suppressed; it does not drive the setting. */
  addEventListener("wheel", (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  /* Chromium's --app windows do NOT reserve chrome-level keys (see
     BrowserCommandController::IsReservedCommandOrKey — "In Apps mode, no
     keys are reserved"), so a page handler can swallow them before the
     browser acts. Block the set that would surface browser chrome or
     dialogs: new tab/window/incognito, close, quit, print, save,
     view-source, bookmark, history, downloads, devtools — and the zoom
     keys, which stay dead. Text-editing combos (ctrl+c/v/x/a) and the
     app's own keys pass. */
  addEventListener("keydown", (e) => {
    if (e.key === "F12") { e.preventDefault(); return; }
    if (!e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (e.key.length === 1 && "+-=0".includes(e.key)) { e.preventDefault(); return; } // zoom keys: dead
    if ("tnwqsudhjp".includes(k) && k.length === 1) e.preventDefault(); // chrome commands (ctrl / ctrl+shift alike)
    if (e.shiftKey && "ijc".includes(k) && k.length === 1) e.preventDefault(); // devtools
  });
  document.addEventListener("contextmenu", (e) => e.preventDefault(), true); // capture: default menu gone everywhere; the episode listener above still opens the app's own menu
  /* The window shows only the hub — nothing navigates in-window (what
     Electron/Tauri wrappers do). Plain anchors and middle/ctrl/shift clicks
     route to the system browser through the app's own openExternal path;
     drops can't navigate either. Left clicks on the app's own AniList chip
     (data-a=ext, no modifiers) stay with the delegated action handler. */
  const shellNav = (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.button === 2) return;
    if (a.dataset.a === "ext" && e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) return;
    e.preventDefault();
    openExternal(a.href);
  };
  document.addEventListener("click", shellNav, true);
  document.addEventListener("auxclick", shellNav, true); // middle click
  addEventListener("dragover", (e) => e.preventDefault());
  addEventListener("drop", (e) => e.preventDefault());
}
/* Images fade in once decoded; a 404 keeps the title placeholder. */
document.addEventListener("load", (e) => { const t = e.target; if (t.tagName === "IMG") { t.classList.add("ready"); t.parentElement?.classList.add("ready"); } }, true);
document.addEventListener("error", (e) => { const t = e.target; if (t.tagName === "IMG" && t.parentElement?.classList.contains("poster")) t.remove(); }, true);
$("#brand").addEventListener("click", () => nav("home"));
/* ripple on primary controls */
document.addEventListener("pointerdown", (e) => {
  if (reduceMotion() || e.button) return;
  const t = e.target.closest(".btn,.pill,.dl-btn,.choice");
  if (!t || t.disabled) return;
  const r = t.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, s = document.createElement("span");
  s.className = "rpl";
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  t.appendChild(s); s.addEventListener("animationend", () => s.remove());
}, { passive: true });
/* Press-and-hold on an episode opens the same menu as right-click does on
   the desktop — the only way a touch user reaches per-episode actions
   (mark watched, reset, play the other audio, download). A short movement
   or a lift before the timer cancels it, so scrolling and a plain tap are
   never swallowed. */
(() => {
  let tm = 0, sx = 0, sy = 0, el = null;
  const cancel = () => { clearTimeout(tm); tm = 0; el = null; };
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return; // desktop keeps right-click
    const t = e.target.closest && e.target.closest(".ep");
    if (!t || !t.dataset.v) return;
    el = t; sx = e.clientX; sy = e.clientY;
    tm = setTimeout(() => {
      tm = 0;
      if (!el) return;
      navigator.vibrate?.(12);
      cmOpenedAt = Date.now();
      openCm(el.dataset.v);
    }, 480);
  }, { passive: true });
  document.addEventListener("pointermove", (e) => {
    if (!tm) return;
    if (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10) cancel();
  }, { passive: true });
  for (const ev of ["pointerup", "pointercancel", "scroll"]) document.addEventListener(ev, cancel, { passive: true });
  /* The sheet opens on hold, but the finger is still down: the click that
     fires when it finally lifts would play the episode behind the sheet.
     A freshly-opened sheet therefore swallows the next episode click. */
  document.addEventListener("click", (e) => {
    if (Date.now() - cmOpenedAt > 700) return;
    if (!e.target.closest || !e.target.closest(".ep")) return;
    e.stopPropagation(); e.preventDefault();
  }, true);
})();
/* cursor-following sheen on cards; subtle 3D tilt on the detail poster */
let pmRaf = 0;
document.addEventListener("pointermove", (e) => {
  if (reduceMotion() || e.pointerType === "touch") return;
  const t = e.target.closest && e.target.closest(".pw,.cont,.ep,.hero .poster");
  if (!t) return;
  cancelAnimationFrame(pmRaf);
  pmRaf = requestAnimationFrame(() => {
    const r = t.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (t.matches(".hero .poster")) {
      t.classList.add("tilting");
      t.style.setProperty("--ry", (x / r.width - 0.5) * 9 + "deg"); t.style.setProperty("--rx", -(y / r.height - 0.5) * 9 + "deg");
      t.style.setProperty("--gx", x + "px"); t.style.setProperty("--gy", y + "px");
    } else { t.style.setProperty("--mx", x + "px"); t.style.setProperty("--my", y + "px"); }
  });
}, { passive: true });
document.addEventListener("pointerout", (e) => {
  const t = e.target.closest && e.target.closest(".hero .poster");
  if (t && !t.contains(e.relatedTarget)) { t.classList.remove("tilting"); t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg"); }
});
addEventListener("resize", () => $$("[data-glide]").forEach(glide));
const q = $("#q");
q.addEventListener("input", () => { S.q = q.value; S.alres = null; S.alq = null; S.menu = S.q.trim() ? "sr" : null; paintNav(); });
q.addEventListener("focus", () => { if (S.q.trim()) { S.menu = "sr"; paintNav(); } });
q.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    const items = $$("#sr .mi");
    if (!items.length) return;
    e.preventDefault();
    let i = items.findIndex((x) => x.classList.contains("sel"));
    items.forEach((x) => x.classList.remove("sel"));
    i = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[i].classList.add("sel"); items[i].scrollIntoView({ block: "nearest" });
    return;
  }
  if (e.key !== "Enter") return;
  const picked = $("#sr .mi.sel");
  if (picked) { e.preventDefault(); q.blur(); picked.click(); return; }
  const t = S.q.trim().toLowerCase();
  if (!t) return;
  const hit = S.data.shows.find((s) => `${s.collection || ""} ${s.title}`.toLowerCase().includes(t));
  if (hit) { q.blur(); openShow(hit.id); } else if (alSearchable()) A.alsearch();
});
addEventListener("scroll", () => document.body.classList.toggle("sc", scrollY > 8), { passive: true });

/* keyboard: / search · Esc back · j/k/h/l or arrows move focus · Enter opens */
const focusables = () => $$("#app .hhero .pill, #app .cont, #app .card, #app .ep, #app .hr").filter((el) => el.offsetParent);
function applyFocus() {
  const els = focusables();
  if (fIdx >= 0 && els[fIdx]) { els.forEach((e, i) => e.classList.toggle("focused", i === fIdx)); els[fIdx].scrollIntoView({ block: "nearest" }); } else fIdx = -1;
}
function moveFocus(dir) {
  const els = focusables().map((el) => { const r = el.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
  if (!els.length || fIdx >= els.length) { fIdx = 0; return applyFocus(); }
  const cur = els[fIdx];
  let best = -1, bs = Infinity;
  els.forEach((o, i) => {
    if (i === fIdx) return;
    const dx = o.cx - cur.cx, dy = o.cy - cur.cy;
    const [ok, sc] = dir === "down" ? [dy > 4, Math.abs(dx) * 2.5 + dy] : dir === "up" ? [dy < -4, Math.abs(dx) * 2.5 - dy] : dir === "right" ? [dx > 4, Math.abs(dy) * 2.5 + dx] : [dx < -4, Math.abs(dy) * 2.5 - dx];
    if (ok && sc < bs) { bs = sc; best = i; }
  });
  if (best >= 0) { fIdx = best; applyFocus(); }
}
document.addEventListener("keydown", (e) => {
  const inInput = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if (S.modal) {
    if (e.key === "Escape") { e.preventDefault(); const t = S.modal.t; t === "tour" ? finishTour(true) : t === "rec" ? recDone() : t === "done" ? A.dnskip() : closeModal(); }
    else if (e.key === "Tab") {
      const f = $$("#modal :is(button,select,input):not(:disabled)"), i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); }
    } else if (e.key === "Enter" && document.activeElement.id === "tok") { e.preventDefault(); $("[data-a=anitoken]")?.click(); }
    else if (e.key === "Enter" && document.activeElement.id === "libpath-tour") { e.preventDefault(); A.dirbrowse(null, document.activeElement); }
    else if (e.key === "Enter" && document.activeElement.id === "slq") { e.preventDefault(); A.slsearch(); }
    return;
  }
  if (e.key === "Enter" && document.activeElement.id === "libpath-settings") { e.preventDefault(); A.dirbrowse(null, document.activeElement); return; }
  if (e.key === "Enter" && document.activeElement.id?.startsWith("mq-")) { e.preventDefault(); A.msearch(document.activeElement.id.slice(3)); return; }
  if (e.key === "/" && !inInput) { e.preventDefault(); q.focus(); return; }
  if (e.key === "Escape") {
    if (S.menu) { S.menu = null; paintNav(); return; }
    if (S.q) { clearSearch(); paintNav(); q.blur(); return; }
    if (inInput) { document.activeElement.blur(); return; }
    if (S.view === "show") A.back(); else if (S.view !== "home") nav("home");
    return;
  }
  if (inInput) return;
  const dirs = { j: "down", k: "up", h: "left", l: "right", ArrowDown: "down", ArrowUp: "up", ArrowLeft: "left", ArrowRight: "right" }, dir = dirs[e.key];
  if (dir) { e.preventDefault(); if (fIdx < 0) { fIdx = 0; applyFocus(); } else moveFocus(dir); }
  else if (e.key === "Enter" && fIdx >= 0) focusables()[fIdx]?.click();
  else if (e.key === "Enter" && document.activeElement.classList.contains("ep")) document.activeElement.click();
});

/* ---------- browser history (back/forward, mouse side buttons, #deep links) ---------- */
let navSeeded = false;
const navSnap = () => ({ view: S.view, showId: S.showId, seasonIdx: S.seasonIdx, back: S.showBack, scroll: scrollY });
const navUrl = () => location.pathname + location.search + (S.view === "show" ? "#show=" + encodeURIComponent(S.showId) : VIEWS.includes(S.view) && S.view !== "home" ? "#" + S.view : "");
function pushNav() {
  const h = navSnap();
  if (navSeeded) history.pushState(h, "", navUrl()); else { navSeeded = true; history.replaceState(h, "", navUrl()); }
}
function applyNav(h) {
  S.navIn = true; S.view = VIEWS.includes(h.view) || h.view === "show" ? h.view : "home"; S.showId = h.showId ?? null; S.seasonIdx = h.seasonIdx || 0; S.showBack = h.back || "home";
  clearSearch(); render();
  history.replaceState(h, "", navUrl());
  scrollTo(0, h.scroll || 0);
}
addEventListener("popstate", (e) => applyNav(e.state || {}));
history.replaceState(navSnap(), "", location.href);
navSeeded = true;

/* ---------- boot ---------- */
aniStatusRefresh();
const hashShow = location.hash.match(/^#show=(.+)$/), hashView = location.hash.match(/^#(library|history|stats|settings)$/);
applyZoom(); // before first paint, so the UI never flashes at 100 %
reload().then(() => {
  if (!S.data) return;
  const hashRel = hashShow && decodeURIComponent(hashShow[1]).match(/^aid:(\d+)$/);
  if (hashRel && !showById("aid:" + hashRel[1])) { openRelease(+hashRel[1]); return; }
  if (hashShow && showById(decodeURIComponent(hashShow[1]))) { S.showId = decodeURIComponent(hashShow[1]); S.view = "show"; const s = showById(S.showId), t = pickTarget(s); S.seasonIdx = t ? Math.max(0, s.seasons.indexOf(t.sea)) : 0; S.navIn = true; render(); }
  else if (hashView) { S.view = hashView[1]; S.navIn = true; render(); }
}).then(pollNow).then(loadSettings).then(maybeTour).then(maybeInstallBar);

addEventListener("error", (e) => { if (e.target === window) toast("UI error: " + e.message); });
addEventListener("unhandledrejection", (e) => toast("UI error: " + (e.reason?.message || e.reason)));

/* ---------- PWA: install + offline shell ----------
   The hub is a local server, so "install" means a home-screen/desktop icon
   that opens the UI like an app. Chromium fires `beforeinstallprompt` when
   the manifest + service worker qualify; we stash it and surface a small,
   dismissible bar (and a Settings row) instead of letting the browser show
   its own mini-infobar. iOS has no such event — Safari only installs via
   Share → Add to Home Screen, so the bar explains that path instead. */
let installEvt = null;
const standalone = () => matchMedia("(display-mode:standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const installDismissed = () => lsGet("hubInstallDismissed", false);
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); installEvt = e;
  if (S.view === "settings") render();
  maybeInstallBar();
});
addEventListener("appinstalled", () => {
  installEvt = null;
  lsSet("hubInstallDismissed", true);
  $("#installbar")?.remove();
  toast("Anime Hub installed");
  if (S.view === "settings") render();
});
/* The offer is only useful where the app can actually be installed and has
   not been dismissed. */
function installOffer() {
  if (standalone() || installDismissed()) return null;
  if (installEvt) return { kind: "prompt" };
  if (isIOS()) return { kind: "ios" };
  return null;
}
async function doInstall() {
  if (!installEvt) return;
  installEvt.prompt();
  try { await installEvt.userChoice; } catch {}
  installEvt = null;
  $("#installbar")?.remove();
  if (S.view === "settings") render();
}
function maybeInstallBar() {
  const old = $("#installbar");
  const o = installOffer();
  if (!o || (S.view === "settings" && o.kind === "prompt")) { old?.remove(); return; }
  if (old) return;
  const bar = document.createElement("div");
  bar.id = "installbar";
  bar.innerHTML = `<i class="ico-wrap">${ico("download")}</i><div class="it"><b>Install Anime Hub</b><small>${o.kind === "ios" ? "Tap Share, then “Add to Home Screen”." : "Keep it on your home screen, opened like an app."}</small></div>
    <button class="btn pri" id="installgo">${o.kind === "ios" ? "Got it" : "Install"}</button><button class="chip ib" id="installno" aria-label="Dismiss">${ico("close")}</button>`;
  document.body.appendChild(bar);
  const go = bar.querySelector("#installgo");
  go.addEventListener("click", () => (o.kind === "ios" ? (lsSet("hubInstallDismissed", true), bar.remove()) : doInstall()));
  bar.querySelector("#installno").addEventListener("click", () => { lsSet("hubInstallDismissed", true); bar.remove(); });
}
/* The offline shell is what makes the app installable and lets the UI open
   when the hub is briefly unreachable. Registered last so it never delays
   the first paint; a failure (e.g. an old browser) is silent and harmless. */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
