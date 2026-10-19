"use client";

// Energetic chimes for the live voice conversation: a quick rising power-up arpeggio when ABI
// starts listening, a short falling one when it ends. Made with Web Audio (no files).
let ctx: AudioContext | null = null;

function play(notes: number[], step: number, sweep: number) {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const out = ctx.createGain();
    out.gain.value = 0.22;
    out.connect(ctx.destination);
    const t0 = ctx.currentTime + 0.02;
    notes.forEach((freq, i) => {
      const t = t0 + i * step;
      const last = i === notes.length - 1;
      const len = last ? 0.38 : step + 0.08;
      // A bright triangle plus a soft square an octave up, each note gliding into pitch.
      for (const [type, mult, level] of [["triangle", 1, 1], ["square", 2, 0.12]] as const) {
        const osc = ctx!.createOscillator();
        const gain = ctx!.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq * mult * sweep, t);
        osc.frequency.exponentialRampToValueAtTime(freq * mult, t + 0.04);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(level, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
        osc.connect(gain).connect(out);
        osc.start(t);
        osc.stop(t + len + 0.02);
      }
    });
  } catch {
    // No audio (old browser, blocked): the conversation works without the chime.
  }
}

export const chimeStart = () => play([523.25, 659.25, 783.99, 1046.5], 0.065, 0.8); // C5 E5 G5 C6
export const chimeEnd = () => play([783.99, 659.25, 523.25], 0.08, 1.15); // G5 E5 C5
