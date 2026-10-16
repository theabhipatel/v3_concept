"use client";

// Live conversation: a hands-free loop. The browser listens continuously and a voice activity
// detector (Silero VAD, running locally in the browser) notices when the visitor starts and
// stops talking. Each finished sentence goes to Groq Whisper, then ABI acts and speaks, then
// listens again. Audio never leaves the browser except that one transcription request.
import type { MicVAD } from "@ricky0123/vad-web";
import { abi } from "./abi-store";
import { stopSpeaking } from "./voice";

// Model, worklet and WASM files come from the CDN, pinned to the installed versions.
const VAD_ASSETS = "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.31/dist/";
const ORT_WASM = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";
const SAMPLE_RATE = 16000;

let vad: MicVAD | null = null;
let starting = false;
let onText: (text: string) => Promise<void> = async () => {};

export function configureLive(handler: (text: string) => Promise<void>) {
  onText = handler;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isLive = () => abi.get().live !== "off" && abi.get().live !== "error";

/** 16-bit mono WAV from the VAD's Float32 samples (what Whisper accepts). */
function toWav(samples: Float32Array) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((v, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true));
  return new Blob([buffer], { type: "audio/wav" });
}

async function transcribe(samples: Float32Array) {
  const form = new FormData();
  form.append("audio", toWav(samples), "speech.wav");
  const res = await fetch("/api/agent/transcribe", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "transcription failed");
  return String(data.text ?? "").trim();
}

/** Wait until ABI has finished speaking (speech starts a moment after the answer arrives). */
async function untilQuiet() {
  await sleep(400);
  const start = performance.now();
  while (isLive() && performance.now() - start < 90_000) {
    if (!window.speechSynthesis?.speaking && !abi.get().speaking) return;
    await sleep(150);
  }
}

async function resumeListening() {
  if (!vad || !isLive()) return;
  abi.setVoice({ caption: "" });
  abi.setLive("listening");
  await vad.start();
}

async function onUtterance(samples: Float32Array) {
  if (!vad || !isLive()) return;
  await vad.pause(); // ABI does not listen to itself while it thinks and speaks
  abi.setLive("thinking");
  try {
    const text = await transcribe(samples);
    if (!text || !isLive()) return void (await resumeListening());
    await onText(text);
    if (!isLive()) return;
    abi.setLive("speaking");
    await untilQuiet();
  } catch {
    abi.setVoice({ caption: "I didn't catch that. Try again." });
    await sleep(1200);
  }
  await resumeListening();
}

export async function startLive() {
  if (vad || starting) return;
  starting = true;
  stopSpeaking();
  abi.setLive("starting");
  try {
    const { MicVAD } = await import("@ricky0123/vad-web");
    const instance = await MicVAD.new({
      model: "v5",
      baseAssetPath: VAD_ASSETS,
      onnxWASMBasePath: ORT_WASM,
      positiveSpeechThreshold: 0.6,
      negativeSpeechThreshold: 0.45,
      redemptionMs: 900, // pause length that ends a sentence
      minSpeechMs: 300,
      preSpeechPadMs: 300,
      startOnLoad: false,
      getStream: () =>
        navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        }),
      onSpeechStart: () => abi.setLive("hearing"),
      onVADMisfire: () => {
        if (isLive()) abi.setLive("listening");
      },
      onSpeechEnd: (audio) => void onUtterance(audio),
    });
    if (!isLive()) {
      await instance.destroy();
      return;
    }
    vad = instance;
    await resumeListening();
  } catch {
    abi.setLive("error");
    abi.setVoice({ caption: "I couldn't use the microphone. Check the browser permission and try again." });
  } finally {
    starting = false;
  }
}

/** Skip the rest of ABI's spoken answer and listen again. */
export function interruptLive() {
  stopSpeaking();
}

async function teardown() {
  const v = vad;
  vad = null;
  stopSpeaking();
  abi.setVoice({ caption: "" });
  await v?.destroy().catch(() => undefined);
}

// Ending live mode from anywhere (the End button, closing the panel) releases the microphone.
abi.subscribe(() => {
  if (abi.get().live === "off" && vad) void teardown();
});
