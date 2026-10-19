// OpenAI models for power mode. The list itself comes live from the user's key (/v1/models);
// OpenAI does not return prices there, so they come from this table, copied from the official
// pricing page (developers.openai.com/api/docs/pricing, standard tier) on 2026-10-19.

export const DEFAULT_MAIN_MODEL = "gpt-6-luna";
export const DEFAULT_VOICE = "marin";
/** Push-to-talk in power mode: transcription and spoken answers. */
export const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
export const TTS_MODEL = "gpt-4o-mini-tts";

/** Every voice the Realtime models (and the spoken answers in push-to-talk) can use. */
export const VOICES = ["marin", "cedar", "alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"] as const;
export type Voice = (typeof VOICES)[number];

/** GPT-Live has its own, larger set of voices (developers.openai.com/api/docs/guides/live-conversations). */
export const LIVE_VOICES = [
  "marin", "quartz", "ripple", "vesper", "willow", "stone", "gleam", "meridian", "bossa", "tempo", "beacon",
  "delta", "cinder", "nuri", "juni", "flitz", "brise", "sillage", "nira", "harema", "shida", "noeul",
] as const;
export const DEFAULT_LIVE_VOICE = "marin";
export const LIVE_MODEL = "gpt-live-1";
/** Live conversation: GPT-Live by default; the Realtime models stay available. */
export const DEFAULT_REALTIME_MODEL = LIVE_MODEL;
export const isLiveModel = (id: string) => id.startsWith("gpt-live-");

/** A user's power settings as the browser sees them: never the key, only whether one is saved. */
export interface PowerSettings {
  hasKey: boolean;
  keyHint: string | null;
  enabled: boolean;
  mainModel: string;
  realtimeModel: string;
  voice: string;
  liveVoice: string;
}

/** USD per 1M tokens: [input, cached input, output]. Realtime prices are audio tokens. */
type Price = [number, number | null, number];

const TEXT: Record<string, Price> = {
  "gpt-6-astra": [10, 1, 50],
  "gpt-6.1-sol": [2, 0.1, 10],
  "gpt-6-sol": [2, 0.2, 10],
  "gpt-6-luna": [0.1, 0.01, 0.5],
  "gpt-5.6-sol": [4, 0.4, 20],
  "gpt-5.6-terra": [2, 0.2, 12],
  "gpt-5.6-luna": [0.2, 0.02, 1.2],
  "gpt-5.5": [5, 0.5, 30],
  "gpt-5.5-pro": [30, null, 180],
  "gpt-5.4": [2.5, 0.25, 15],
  "gpt-5.4-mini": [0.75, 0.075, 4.5],
  "gpt-5.4-nano": [0.2, 0.02, 1.25],
  "gpt-5.4-pro": [30, null, 180],
  "gpt-5.2": [1.75, 0.175, 14],
  "gpt-5.2-pro": [21, null, 168],
  "gpt-5.1": [1.25, 0.125, 10],
  "gpt-5": [1.25, 0.125, 10],
  "gpt-5-mini": [0.25, 0.025, 2],
  "gpt-5-nano": [0.05, 0.005, 0.4],
  "gpt-5-pro": [15, null, 120],
  "gpt-4.1": [2, 0.5, 8],
  "gpt-4.1-mini": [0.4, 0.1, 1.6],
  "gpt-4.1-nano": [0.1, 0.025, 0.4],
  "gpt-4o": [2.5, 1.25, 10],
  "gpt-4o-mini": [0.15, 0.075, 0.6],
  o1: [15, 7.5, 60],
  "o1-pro": [150, null, 600],
  o3: [2, 0.5, 8],
  "o3-pro": [20, null, 80],
  "o3-mini": [1.1, 0.55, 4.4],
  "o4-mini": [1.1, 0.275, 4.4],
};

const REALTIME: Record<string, Price> = {
  "gpt-realtime-2.1": [32, 0.4, 64],
  "gpt-realtime-2.1-mini": [10, 0.3, 20],
  "gpt-realtime-2": [32, 0.4, 64],
  "gpt-realtime-1.5": [32, 0.4, 64],
  "gpt-realtime": [32, 0.4, 64],
  "gpt-realtime-mini": [10, 0.3, 20],
};

export interface ModelOption {
  id: string;
  price: { input: number; cached: number | null; output: number } | null;
  /** Billed per minute instead of per token (GPT-Live). */
  perMinute?: number;
  /** Short note shown on the option. */
  note?: string;
}

const NOTES: Record<string, string> = {
  "gpt-6-luna": "Fast and very cheap. Recommended",
  "gpt-6-sol": "Smarter, 20x the price of Luna",
  "gpt-6.1-sol": "Newest Sol",
  "gpt-6-astra": "Most capable, most expensive",
  "gpt-realtime-2.1": "Best Realtime model, tools run in the voice model",
  "gpt-realtime-2.1-mini": "About 3x cheaper",
  "gpt-realtime": "Older, being retired",
  "gpt-realtime-mini": "Older, being retired",
  [LIVE_MODEL]: "Listens and speaks at once, delegates to your main model. Recommended",
};

const SKIP = /realtime|audio|tts|transcribe|whisper|search|image|embedding|moderation|instruct|codex|diarize|live|translate|dall-e|sora|computer|deep-research|babbage|davinci/;
const SNAPSHOT = /-\d{4}-\d{2}-\d{2}$|-\d{4}$/;

function option(id: string, table: Record<string, Price>): ModelOption {
  const p = table[id];
  return { id, price: p ? { input: p[0], cached: p[1], output: p[2] } : null, note: NOTES[id] };
}

/** Sort known models in the pricing table's order (newest families first), unknown ones last. */
function byTable(table: Record<string, Price>) {
  const order = Object.keys(table);
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length);
  return (a: string, b: string) => rank(a) - rank(b) || a.localeCompare(b);
}

/** Split the ids a key can use into main (text) and realtime models, with prices. */
export function classifyModels(ids: string[]) {
  const clean = ids.filter((id) => !SNAPSHOT.test(id));
  const main = clean.filter((id) => /^(gpt-|o\d|chatgpt-)/.test(id) && !SKIP.test(id)).sort(byTable(TEXT));
  const realtime = clean.filter((id) => /realtime/.test(id) && !/translate|whisper/.test(id)).sort(byTable(REALTIME));
  // GPT-Live is not always in the models list, so it is always offered.
  const live: ModelOption = { id: LIVE_MODEL, price: null, perMinute: 0.05, note: NOTES[LIVE_MODEL] };
  // The recommended defaults lead their lists.
  const first = (ids: string[], id: string) => (ids.includes(id) ? [id, ...ids.filter((x) => x !== id)] : ids);
  return { main: first(main, DEFAULT_MAIN_MODEL).map((id) => option(id, TEXT)), realtime: [live, ...realtime.map((id) => option(id, REALTIME))] };
}

/** Group models into families for the picker (GPT-6, GPT-5, ...). */
export function familyOf(id: string) {
  if (isLiveModel(id)) return "GPT-Live";
  if (/realtime/.test(id)) return "Realtime";
  const m = id.match(/^gpt-(\d)/);
  if (m) return `GPT-${m[1]}`;
  if (/^o\d/.test(id)) return "Reasoning (o-series)";
  return "Other";
}

export function formatPrice(n: number) {
  return n >= 1 ? `$${n % 1 ? n.toFixed(2) : n}` : `$${n.toFixed(n < 0.1 ? 3 : 2).replace(/0+$/, "")}`;
}
