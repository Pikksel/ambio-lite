# 🌧️ Ambio Lite

### Inspired by the Android app [**Ambio** by jaimebg](https://github.com/jaimebg/Ambio).

A calm, minimal **ambient-sound focus timer** that runs in the browser and installs on your phone as an app.
Mix up to three looping sounds, start a 25-minute session.

Built with plain **HTML, CSS and JavaScript**: no frameworks, no build step, no dependencies.


<!-- Replace with your GitHub Pages URL after deploying -->
**▶ Live demo:** `https://Pikksel.github.io/ambio-lite/`

---

## ✨ Features

- **Sound mixer**: pick up to 3 ambient loops, each with its own volume slider
- **Focus timer**: 25-minute countdown with Start / Pause / Reset and a chime at the end
- **Mood colours**: the background blends the colours of your selected sounds, weighted by volume
- **Installable (PWA)**: add it to your home screen; opens full-screen like a native app
- **Works offline**: all files and sounds are cached on the device after the first visit
- **Lock-screen controls**: play/pause from the notification shade on Android

## 📱 Install on Android

1. Open the live demo in Chrome (or any Chromium-based browser, e.g. Vanadium).
2. Tap the **⋮** menu → **Install app** / **Add to Home screen**.
3. Launch *Ambio Lite* from your home screen. It now works without internet.

## 💻 Run locally on PC

Just double-click `index.html`.

## 🗂️ Project structure

| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `style.css` | Layout, colours, transitions |
| `app.js` | State, audio playback, timer, rendering, media session |
| `manifest.json` | PWA metadata: name, icons, display mode |
| `sw.js` | Service worker: offline caching (incl. audio range requests) |
| `icons/` | App icons |
| `sounds/` | Ambient loops (OGG Vorbis) |

## 🧠 How it works

- **State → render:** one `state` object holds everything; every action updates it and calls `render()`,
  the same idea as React, written by hand.
- **Drift-free timer:** stores *when* the session ends and recomputes the remaining time from the clock,
  instead of trusting `setInterval` to fire exactly once per second.
- **Offline:** the service worker serves app files network-first (fresh when online) and sounds cache-first.
  It slices cached audio to answer `Range` requests with `206 Partial Content`.

---

## ⚖️ License & royalties

**Ambio Lite is 100% free and royalty-free.** You can use, copy, modify, and share it, including commercially,
without paying anyone.

| Part | License | What it means |
|---|---|---|
| **Code** (HTML, CSS, JS, icons) | [MIT](LICENSE) | Free to use and modify; keep the copyright notice |
| **Sounds** (`sounds/`) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain) | No royalties, no attribution required |

No code from the original Ambio is used; this is an independent re-implementation for the web.

## 🙏 Credits

- **Original app & inspiration:** [jaimebg/Ambio](https://github.com/jaimebg/Ambio) (MIT), an ambient-sound focus app for Android.
- **Audio:** all sound files come from Ambio and are CC0 / public domain. Details per file
  (from Ambio's [ATTRIBUTION.md](https://github.com/jaimebg/Ambio/blob/main/ATTRIBUTION.md)):

| Sound | Source |
|---|---|
| Birds | Freesound [#234315](https://freesound.org/s/234315/) by nick121087, CC0 |
| Café | Freesound [#625112](https://freesound.org/s/625112/) by sonically_sound, CC0 |
| Wind | Freesound [#521736](https://freesound.org/s/521736/) by Fission9, CC0 |
| Brown noise | Generated from a fixed seed; public domain |
| Rain, Ocean, Forest, Fireplace, Timer chime | CC0 / public domain; upstream source not recorded by Ambio |

Thanks to the Freesound community for sharing their recordings.

