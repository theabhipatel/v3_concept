"use client";

// Chimes for the live voice conversation, Google Meet style: a join sound when ABI starts
// listening, a leave sound when it ends. Free sound files in public/sounds.
const SOUNDS = { start: "/sounds/abi-voice-start.mp3", end: "/sounds/abi-voice-end.mp3" };
const cache: Partial<Record<keyof typeof SOUNDS, HTMLAudioElement>> = {};

function play(name: keyof typeof SOUNDS) {
  try {
    const audio = (cache[name] ??= new Audio(SOUNDS[name]));
    audio.volume = 0.6;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined); // blocked autoplay: the conversation works without it
  } catch {}
}

/** Load both files ahead of time so the first chime plays without a delay. */
export function preloadChimes() {
  for (const name of Object.keys(SOUNDS) as (keyof typeof SOUNDS)[]) {
    cache[name] ??= Object.assign(new Audio(SOUNDS[name]), { preload: "auto" });
  }
}

export const chimeStart = () => play("start");
export const chimeEnd = () => play("end");
