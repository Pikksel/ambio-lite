// Ambio Lite (web): ambient sound mixer + 25-minute focus timer.
// Plain JavaScript, no build step, no libraries.
//
// Pattern: one `state` object holds everything that can change.
// Event handlers change `state`, then call `render()` (updates the DOM)
// and `syncAudio()` (makes the <audio> players match the state).
// Same idea as React, just done by hand.

const FOCUS_MINUTES = 25;
const MAX_ACTIVE = 3;
const DEFAULT_VOLUME = 0.7;
const IDLE_COLOR = [30, 32, 40]; // background when no sound is selected

// Each sound has a file in sounds/<id>_loop.ogg and a background colour.
// Colours are kept dark so white text stays readable on any mix.
const SOUNDS = [
  { id: "rain",        label: "Rain",        emoji: "🌧️", color: [52, 73, 110] },
  { id: "ocean",       label: "Ocean",       emoji: "🌊", color: [20, 90, 120] },
  { id: "forest",      label: "Forest",      emoji: "🌲", color: [34, 85, 50] },
  { id: "fireplace",   label: "Fireplace",   emoji: "🔥", color: [130, 60, 25] },
  { id: "wind",        label: "Wind",        emoji: "🍃", color: [90, 100, 115] },
  { id: "birds",       label: "Birds",       emoji: "🐦", color: [95, 110, 40] },
  { id: "cafe",        label: "Café",        emoji: "☕", color: [100, 70, 50] },
  { id: "brown_noise", label: "Brown noise", emoji: "🟤", color: [80, 55, 40] },
];

// ---------- State ----------

const state = {
  running: false,
  remainingMs: FOCUS_MINUTES * 60 * 1000,
  endsAt: null,  // timestamp (ms) when the timer reaches 0; only set while running
  volumes: {},   // { soundId: 0..1 } for every sound in the mix
};

// ---------- Audio ----------

// One <audio> element per sound, created the first time it's needed.
const players = {};
const chime = new Audio("sounds/timer_chime.ogg");

function getPlayer(id) {
  if (!players[id]) {
    const audio = new Audio(`sounds/${id}_loop.ogg`);
    audio.loop = true;
    players[id] = audio;
  }
  return players[id];
}

// Make every player match the state: right volume, playing or paused.
function syncAudio() {
  for (const { id } of SOUNDS) {
    const active = id in state.volumes;
    if (!active && !players[id]) continue; // never used, nothing to stop

    const audio = getPlayer(id);
    if (active) audio.volume = state.volumes[id];

    if (active && state.running) {
      // play() returns a Promise; it rejects if the browser blocks autoplay.
      audio.play().catch((err) => console.warn(`Could not play ${id}:`, err));
    } else {
      audio.pause();
    }
  }
}

// ---------- Timer ----------

let tickId = null;

function start() {
  if (state.running) return;
  if (state.remainingMs === 0) state.remainingMs = FOCUS_MINUTES * 60 * 1000;

  state.running = true;
  // Store *when* the timer ends instead of counting down 1 s at a time.
  // setInterval isn't exact (and slows down in background tabs),
  // so we recompute the remaining time from the clock on every tick.
  state.endsAt = Date.now() + state.remainingMs;
  tickId = setInterval(tick, 250);

  syncAudio();
  render();
}

function pause() {
  if (!state.running) return;
  state.running = false;
  state.remainingMs = Math.max(0, state.endsAt - Date.now());
  state.endsAt = null;
  clearInterval(tickId);

  syncAudio();
  render();
}

function reset() {
  pause();
  state.remainingMs = FOCUS_MINUTES * 60 * 1000;
  render();
}

function tick() {
  state.remainingMs = Math.max(0, state.endsAt - Date.now());
  if (state.remainingMs === 0) {
    pause();
    chime.play().catch(() => {});
  }
  render();
}

// ---------- Mixer ----------

function toggleSound(id) {
  if (id in state.volumes) {
    delete state.volumes[id];
  } else if (Object.keys(state.volumes).length < MAX_ACTIVE) {
    state.volumes[id] = DEFAULT_VOLUME;
  }
  syncAudio();
  render();
}

function setVolume(id, value) {
  state.volumes[id] = value;
  syncAudio();
  render();
}

// Blend the colours of the active sounds, weighted by their volume.
function mixColor() {
  let r = 0, g = 0, b = 0, total = 0;
  for (const sound of SOUNDS) {
    const vol = state.volumes[sound.id];
    if (!vol) continue; // not active, or volume 0
    r += sound.color[0] * vol;
    g += sound.color[1] * vol;
    b += sound.color[2] * vol;
    total += vol;
  }
  if (total === 0) return IDLE_COLOR;
  return [r / total, g / total, b / total].map(Math.round);
}

// ---------- Rendering ----------

const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");
const soundsEl = document.getElementById("sounds");

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Build the sound cards once. render() only updates them afterwards.
const cards = {};
for (const sound of SOUNDS) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <button type="button" class="toggle" aria-pressed="false">
      <span class="emoji" aria-hidden="true">${sound.emoji}</span>
      <span>${sound.label}</span>
    </button>
    <input type="range" min="0" max="100" aria-label="${sound.label} volume">
  `;
  const toggle = card.querySelector(".toggle");
  const slider = card.querySelector("input");

  toggle.addEventListener("click", () => toggleSound(sound.id));
  // "input" fires continuously while dragging; "change" only on release.
  slider.addEventListener("input", () => setVolume(sound.id, slider.value / 100));

  soundsEl.append(card);
  cards[sound.id] = { card, toggle, slider };
}

function render() {
  const time = formatTime(state.remainingMs);
  timeEl.textContent = time;
  document.title = state.running ? `${time} · Ambio Lite` : "Ambio Lite";

  startBtn.textContent = state.running ? "Pause" : "Start";

  const activeCount = Object.keys(state.volumes).length;
  if (state.remainingMs === 0) {
    statusEl.textContent = "Session done. Take a break!";
  } else if (activeCount === 0) {
    statusEl.textContent = `Pick up to ${MAX_ACTIVE} sounds, then press Start.`;
  } else if (!state.running) {
    statusEl.textContent = `${activeCount}/${MAX_ACTIVE} sounds selected.`;
  } else {
    statusEl.textContent = "Focus.";
  }

  for (const { id } of SOUNDS) {
    const { card, toggle, slider } = cards[id];
    const active = id in state.volumes;
    card.classList.toggle("active", active);
    toggle.setAttribute("aria-pressed", String(active));
    toggle.disabled = !active && activeCount >= MAX_ACTIVE;
    if (active) slider.value = Math.round(state.volumes[id] * 100);
  }

  const [r, g, b] = mixColor();
  const bg = `rgb(${r}, ${g}, ${b})`;
  document.documentElement.style.setProperty("--bg", bg);
  themeColorMeta.content = bg; // phone status bar matches the background

  updateMediaSession(activeCount);
}

const themeColorMeta = document.querySelector('meta[name="theme-color"]');

// ---------- Media Session (lock screen / notification controls) ----------

// Lets Android show "Ambio Lite" with a play/pause button in the
// notification shade and on the lock screen while sounds are playing.
const hasMediaSession = "mediaSession" in navigator;

if (hasMediaSession) {
  navigator.mediaSession.setActionHandler("play", start);
  navigator.mediaSession.setActionHandler("pause", pause);
}

let lastMediaLabel = null;

function updateMediaSession(activeCount) {
  if (!hasMediaSession) return;
  navigator.mediaSession.playbackState = state.running ? "playing" : "paused";

  const label = SOUNDS.filter((s) => s.id in state.volumes).map((s) => s.label).join(" + ");
  // render() runs 4x per second; only replace the metadata when it actually changes
  if (activeCount === 0 || label === lastMediaLabel) return;
  lastMediaLabel = label;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: label,
    artist: "Ambio Lite",
    artwork: [{ src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }],
  });
}

startBtn.addEventListener("click", () => (state.running ? pause() : start()));
resetBtn.addEventListener("click", reset);

render();

// ---------- Service worker (offline + installable) ----------

// Only works over http://localhost or https:// (not when opened as a file).
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker
    .register("sw.js")
    .catch((err) => console.warn("Service worker registration failed:", err));
}
