# AnimeHub — Mobile

Anime Hub for your phone: browse, track and resume your anime library from the
Android app, or from any mobile browser as an installable PWA.

The hub behind it is a local library server (credit:
[Elias8832](https://github.com/Elias8832/AnimeHub)) that reads your anime folder
and plays video in mpv on the machine running it. This repository packages that
hub for Android and keeps the mobile UI in shape.

## Download the Android app

**[⤓ Anime Hub APK](https://github.com/Felix-significant-meat/AnimeHub/releases/latest)**

Install it on your phone, then point it at your hub — see
[Run the hub](#run-the-hub).

## Important!

This app is early in development — expect bugs and breaking changes.

## Features

- **Main-page** - Quick resume most recently watched animes and currently airing info.

![Home](docs/screenshots/home.png)

- **Library** - List all your animes, with extensive filter options.

![Library](docs/screenshots/library.png)

- **Show-page** - Detail page per anime with play button, episode list, etc.

![Show](docs/screenshots/show.png)

- **Stats-page** - Per-show time watched, formats, lists, scores and release years.

![Stats](docs/screenshots/stats.png)

- **Settings** - Configure AniList integration, appearance, etc.

![Settings](docs/screenshots/settings.png)

- **Resume** - the app opens on what you were watching, with progress shared between the hub and your phone.
- **AniList** - Matches all your animes against AniList to acquire metadata, coverart, etc. and supports rating, progress, etc. editing.
- **Playback** - running on the hub machine in mpv: resume, auto-play next, progress tracking and a skip-credits hotkey. Your mpv config still works. The phone app drives it; see [What the phone can and cannot do](#what-the-phone-can-and-cannot-do).
- **Online episodes (optional)** - with [ani-cli](https://github.com/pystardust/ani-cli) installed on the hub machine, every show lists the episodes you don't have as online episodes: tap one and it plays in mpv with the same resume, progress tracking, AniList sync and auto-play as local files, or download it straight into your library folder. Shows are matched automatically; "Wrong episodes?" on a show page fixes a bad match.

## Requirements

- A machine to run the hub on (Linux)
- Python 3.9+ (standard library only, nothing to install)
- mpv — playback happens here, not on the phone
- An AniList account (optional)
- ani-cli (optional, for streaming and downloads)

## Run the hub

The hub is what your phone connects to. Nothing to build — it is a single Python
file that serves the UI from `web/`. On the machine that holds your anime
folder:

```sh
./run.sh --host lan
```

`--host lan` makes it reachable from your phone on the same network and prints
the URL to open (e.g. `http://192.168.1.20:8787`). Without it the hub listens on
`127.0.0.1` only. Anything `hub.py` accepts works through `run.sh`, e.g.
`./run.sh --config my-config.json`.

The first run starts with no library: pick your anime folder in
**Settings → Library** (or set `library_root` in the config file). mpv must be
installed to play anything.

### Install as an app (PWA / Android)

The web UI is a PWA: open the hub on your phone and use **Install** — in
Settings → App, or the browser's own prompt — for a home-screen icon that opens
the interface in its own window, without browser chrome. On iPhone/iPad use
Share → Add to Home Screen.
A service worker caches the interface itself, so the app opens even when the
hub is briefly unreachable; library data, artwork and playback are always live
from the hub.

> **Installing needs a secure context.** Browsers only expose service workers
> and the Install prompt on `https://` or `localhost`. Over plain HTTP, a phone
> opening `http://192.168.1.20:8787` gets a **working UI but no Install button
> and no offline shell** — the browser removes `navigator.serviceWorker`
> entirely, and this is a platform rule no server can opt out of. Settings → App
> says so instead of offering an Install that cannot happen.
>
> So the two ways to get a real installed app on a phone are:
>
> 1. **Serve it over HTTPS** — put the hub behind a TLS reverse proxy or a
>    tunnel (Cloudflare Tunnel, `caddy`, `nginx` + a certificate), and list the
>    public name in `allow_hosts` so the `Host` guard accepts it.
> 2. **Serve it from the phone itself** if the library is on the phone — then
>    the origin is `localhost` and Install works.
>
> On **plain-HTTP LAN the hub is still useful** — browse the library, see what
> is next, track progress — but it stays a browser page, and offline does not
> work. Safari on iOS is the one exception: Share → Add to Home Screen makes a
> web clip that opens standalone even over HTTP, though still with no offline
> shell.

**Pointing the app at your hub.** The app renders whatever hub it is given, so
give it the address from the step above (`http://192.168.1.20:8787`).

That address is accepted as the hub machine's own, so `Host` checks pass without
configuration. Behind a reverse proxy or tunnel the `Host` header is the public
name instead — add it to `allow_hosts` so the hub accepts it (any other name
still gets 403, the guard that keeps DNS-rebinding out):
`{ "allow_hosts": ["hub.example.com"] }`. Requests are still checked against an
allowlist of this machine's own names, so DNS-rebinding and foreign `Host`
headers stay out — but LAN mode does expose your library and the hub's write API
to everyone on that network, so keep it off on untrusted networks.

### What the phone can and cannot do

The phone is a remote control for a library that lives on the hub machine.
That split is deliberate — the hub never streams your files — and it has one
consequence worth knowing before you install anything:

| On the phone | Works? |
| --- | --- |
| Browse the library, filters, show pages, stats | ✅ |
| Resume the current show, see and set progress | ✅ |
| Rate, edit AniList entries, mark episodes watched | ✅ |
| **Play an episode** | ❌ — video opens in **mpv on the hub machine** |
| Offline use | ⚠️ UI only; library data and artwork need the hub |

Tapping play starts playback on the hub machine, not in the phone app. There is
no transcoding and no streaming to the device, so the phone cannot play video
itself; playing on the phone would mean adding an ffmpeg → HLS pipeline, which
contradicts the hub's "no streaming or hosting" stance (see the notice below).

### Android app (Trusted Web Activity)

`android/` holds the hub packaged as an Android app with PWABuilder — a Trusted
Web Activity, i.e. a thin shell that renders the same site fullscreen, without
the browser's address bar. `android/dist/` contains the installable `.apk` and
the Play-ready `.aab`; see [`android/README.md`](android/README.md) for how to
rebuild it against your own address.

For a Trusted Web Activity to keep its fullscreen mode, Android must be able to
verify that the site owns the app, by fetching
`https://<your-address>/.well-known/assetlinks.json` and comparing the package
name and signing fingerprint to the installed APK. The hub serves that file from
`web/.well-known/assetlinks.json`. If it is missing or the fingerprint does not
match, the app still runs but shows a browser address bar, and nothing reports an
error — so after rebuilding the app, update that file too.

> The packages in `android/dist/` were generated against a temporary sandbox
> address and only open while that address exists. Build your own against your
> own HTTPS address before relying on them.

> **The signing keystore is not in this repository, by design.** `.gitignore`
> excludes `*.keystore`, `*.jks` and `signing-key-info.txt`: the keystore is the
> app's identity, and anyone holding it can sign updates that Android accepts as
> yours. Keep it (and its password) in a password manager with an offline backup.

On a touch device the UI adapts: a bottom tab bar replaces the top-bar links,
episode artwork shows its play button without hovering, a **press-and-hold** on
an episode opens its actions as a bottom sheet (the touch equivalent of
right-click), and the layout respects notches and gesture bars.

## Configuration

`~/.config/anime-hub/config.json` (honours `XDG_CONFIG_HOME`; override
with `--config FILE`). All keys optional, a broken file only warns:

```json
{
  "library_root": "~/Videos/Anime",
  "port": 8787,
  "data_dir": null
}
```

| Key | Meaning |
| --- | --- |
| `library_root` | the folder anime-hub watches for video files (also set from Settings → Library) |
| `port` | server port (default `8787`) |
| `data_dir` | database and cache location (default `~/.local/share/anime-hub`, honours `XDG_DATA_HOME`) |
| `host` | `"127.0.0.1"` (default, this machine only) or `"lan"` (reachable from other devices on the same network, for the PWA on a phone) |
| `allow_hosts` | extra host names to accept, e.g. `["hub.example.com"]` — needed behind a reverse proxy or tunnel, which rewrites the `Host` header |

Changing `library_root` never deletes anything: the app reports the
different folder and waits for you to connect it explicitly.

## Data

All state lives in `data_dir` (default `~/.local/share/anime-hub`):
`hub.db` (watch state, metadata, history), `cache/` (artwork),
`anilist_token.json` (OAuth token). Plain files; deleting the directory
is a full reset.

## Roadmap

Roadmap is only to show whats still planned in big releases. Nothing is set in stone and everything can change anytime.

- **v0.1** (done) — local library, AniList sync, stats.
- **v0.2 (done)** — streaming and downloads delegated to your own installed [ani-cli](https://github.com/pystardust/ani-cli) (the app contains no provider code and fetches no video itself) and a unified local/streaming episode list are in; better tools for unmatched shows are next.
- **v0.3** (in progress) Focus on Quality of Life changes and bug fixes.
- **Later** — multiple library roots

## AI-notice

- Anime-hub was made with a lot of help of mainly GLM 5.3 Flash and very little help of Sonnet 5.5.
- I want to make clear that the use of LLMs did not steal anyones job in this case, Anime-hub simply wouldn't exist without it, as I would have never started this project to begin with.
- I **DID NOT** give a large LLM 200$, a prompt and a couple hours. I made this project step by step, this is my app that I build with passion over many many hours and i want to continue working on it.

## Streaming/downloading/hosting/etc.-notice

- Anime-hub **does not contain any streaming, downloading or hosting of animes**, nor does it bundle any provider code or third-party content. It is a local library manager: it plays video files you already own, and pulls metadata and artwork from AniList.
- The optional streaming and downloads are done entirely by your own installed ani-cli. Anime-hub only starts it (answering its menus itself) and hands mpv its progress-tracking socket; it never contacts a video site.

## License

GPL-3.0. See [LICENSE](LICENSE).

## Credits

- Metadata, artwork and airing times from [AniList](https://anilist.co).
  Unofficial; not affiliated with AniList.
- Playback by [mpv](https://mpv.io).
