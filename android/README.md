# Android app (Trusted Web Activity)

The hub is a web app. This folder holds the Android package built from it with
[PWABuilder](https://www.pwabuilder.com) — a **Trusted Web Activity (TWA)**: a
thin native shell that renders the site you already run, fullscreen and without
the browser's address bar. There is no Android source code to maintain here.

## Contents

| File | Purpose |
| --- | --- |
| `dist/anime-hub.apk` | Direct install on a device (sideloading, testing). |
| `dist/anime-hub.aab` | App Bundle — the format Google Play requires. |

## ⚠️ This package points at a temporary address

The start URL baked into these packages is
`https://8799-i782ybzgyic7y44r841gv-ecea8f22.sandbox.novita.ai` — the throwaway
sandbox origin this build was generated from. Two consequences follow:

* the app only opens while that address is alive, and it is not yours;
* you cannot serve `assetlinks.json` on that host from your own machine, so
  verification cannot be made to survive.

For an app you can actually keep, build the package against **your own** HTTPS
address — your domain, or a tunnel to your own hub — and generate it again.

## Why `.well-known/assetlinks.json` matters

A TWA only drops the address bar if the site proves it owns the app. Android
fetches `https://<your-address>/.well-known/assetlinks.json` and checks it
against the installed app's package name and signing fingerprint. If the file is
missing (a 404), or the fingerprint does not match the installed package, the app
opens as an ordinary browser tab — address bar and all — and **nothing anywhere
reports an error**, which makes this the single most confusing TWA failure.

The hub serves that file: `web/.well-known/assetlinks.json` in this repository is
returned at that exact path by `hub.py`. Its two fields — the package name and
the certificate fingerprint — are public information by design, which is why the
file is safe (and necessary) to commit.

## Rebuilding for your own address

1. Run the hub behind HTTPS (a TLS reverse proxy, or a tunnel) and add the public
   name to `allow_hosts` so the `Host` guard accepts it.
2. Point PWABuilder — or Bubblewrap, which it wraps — at that URL.
3. Save the generated `assetlinks.json` to `web/.well-known/assetlinks.json` here,
   so the hub serves it from your address.
4. Install the app and open it: it should come up without an address bar.

## Signing keys

PWABuilder generated a keystore for this build. It is deliberately **absent** from
this repository and must stay that way: the keystore is the app's identity, and
anyone who holds it can sign updates that Android accepts as yours. `.gitignore`
keeps `*.keystore`, `*.jks` and `signing-key-info.txt` out.

Keep the keystore and its passwords in a password manager, with an offline
backup. Losing it means you can never update an app already published on Play;
leaking it means someone else can.

The password for this particular keystore was shared in plain text when it was
created, so treat it as disposable — generate a fresh keystore for anything you
publish for real.
