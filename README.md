# AnimeHub

A beautiful, local anime library server to display, organize and play animes in mpv.

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

- **Playback** - episodes open in mpv with resume, auto-play next, progress tracking and a skip-credits hotkey. Your mpv config still works.
- **AniList** - Matches all your animes against AniList to acquire metadata, coverart, etc. and supports rating, progress, etc. editing.
- **Online episodes (optional)** - with [ani-cli](https://github.com/pystardust/ani-cli) installed, every show lists the episodes you don't have as online episodes: click one and it plays in mpv with the same resume, progress tracking, AniList sync and auto-play as local files, or download it straight into your library folder. Shows are matched automatically; "Wrong episodes?" on a show page fixes a bad match.

## Requirements

- Linux
- Python 3.9+ (standard library only, nothing to install)
- mpv
- A Chromium-family browser (chromium, chrome,brave, or edge)
- rust/cargo
- An AniList account (optional)
- ani-cli (optional, for streaming and downloads)

## Run

```sh
git clone https://github.com/Elias8832/AnimeHub.git
cd AnimeHub/desktop
cargo build --release
./install.sh
```

The server starts on `http://127.0.0.1:8787`.

### Install as an app (PWA / Android)

The web UI is a full PWA: open the hub in a Chromium browser (desktop or
Android) and use **Install** — in Settings → App, or the browser's own
address-bar prompt — for a home-screen/desktop icon that opens the interface
in its own window, without browser chrome. On iPhone/iPad use Share → Add to
Home Screen. A service worker caches the interface itself, so the app opens
even when the hub is briefly unreachable; library data, artwork and playback
are always live from the hub.

**Using it from your phone.** The hub listens on `127.0.0.1` only by default.
To open the PWA from a phone on the same network, enable LAN mode:

```sh
python3 hub.py --host lan        # one run
```

or permanently in the config file:

```json
{ "host": "lan" }
```

The startup line then prints the URL to open on the phone (e.g.
`http://192.168.1.20:8787`). Requests are still checked against an allowlist of
this machine's own names, so DNS-rebinding and foreign `Host` headers stay out
— but LAN mode does expose your library and the hub's write API to everyone on
that network, so keep it off on untrusted networks. Playback still happens in
mpv on the machine running the hub, not on the phone.

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
  "data_dir": null,
  "window": "app"
}
```

| Key | Meaning |
| --- | --- |
| `library_root` | the folder anime-hub watches for video files (also set from Settings → Library) |
| `port` | server port (default `8787`) |
| `data_dir` | database and cache location (default `~/.local/share/anime-hub`, honours `XDG_DATA_HOME`) |
| `window` | `"app"` (default, standalone Chromium window), `"browser"` (tab), `"none"` (server only; `--no-browser` forces it for one run) |
| `host` | `"127.0.0.1"` (default, this machine only) or `"lan"` (reachable from other devices on the same network, for the PWA on a phone) |

Changing `library_root` never deletes anything: the app reports the
different folder and waits for you to connect it explicitly.

## Data

All state lives in `data_dir` (default `~/.local/share/anime-hub`):
`hub.db` (watch state, metadata, history), `cache/` (artwork),
`anilist_token.json` (OAuth token). Plain files; deleting the directory
is a full reset.

## Roadmap

Roadmap is only to show whats still planned in big releases. Nothing is set in stone and everything can change anytime.

- **v0.1** (done)— local library, AniList sync, stats, desktop wrapper.
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
