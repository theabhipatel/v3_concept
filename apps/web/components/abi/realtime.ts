"use client";

// Power mode live conversation: OpenAI Realtime, speech to speech over WebRTC. The website mints
// a 10-minute key from the user's own key (/api/power/realtime); audio goes straight between the
// browser and OpenAI. The voice model acts on the page through the same actions ABI's agent uses,
// and hands every question about Abhishek to ABI's full agent (ask_abi), so answers stay grounded
// and their cards show up in the chat. Transcripts land in the chat (and are saved when signed in).
// GPT-Live (gpt-live-1) works differently: the server opens the session from the browser's offer,
// and the voice layer delegates every task to the user's main model, whose tool calls run here.
import { powerStore } from "@/components/power/power-store";
import { isLiveModel } from "@/lib/openai-models";
import { abi } from "./abi-store";
import { pageText, runAction, type UiAction } from "./actions";
import { chat, messageText, persist, send } from "./runtime";

let pc: RTCPeerConnection | null = null;
let dc: RTCDataChannel | null = null;
let mic: MediaStream | null = null;
let speaker: HTMLAudioElement | null = null;
let caption = "";
let ending = false;
const handled = new Set<string>();
/** GPT-Live: transcripts arrive as loose deltas, grouped here into turns. */
let live = false;
let heard = "";
let said = "";
let heardId = "";
let quietTimer: number | undefined;
let pendingCalls: Promise<object>[] = [];

const isOn = () => pc !== null;

function sendEvent(event: object) {
  if (dc?.readyState === "open") dc.send(JSON.stringify(event));
}

function addMessage(role: "user" | "assistant", text: string, id = crypto.randomUUID()) {
  chat.messages = [...chat.messages, { id, role, parts: [{ type: "text", text }] }];
  persist();
}

function setMessage(id: string, text: string) {
  chat.messages = text.trim()
    ? chat.messages.map((m) => (m.id === id ? { ...m, parts: [{ type: "text" as const, text }] } : m))
    : chat.messages.filter((m) => m.id !== id);
  persist();
}

const UI: Record<string, (a: Record<string, string>) => UiAction["output"]> = {
  navigate: (a) => ({ ui: "navigate", path: a.path, section: a.section ?? "" }),
  filter_projects: (a) => ({ ui: "filter-projects", category: a.category, type: a.type }),
  filter_skills: (a) => ({ ui: "filter-skills", category: a.category }),
  scroll: (a) => ({ ui: "scroll", direction: a.direction, amount: a.amount }),
  click: (a) => ({ ui: "click", label: a.label }),
  type_text: (a) => ({ ui: "type", field: a.field, text: a.text }),
  control: (a) => ({ ui: "control", action: a.action, value: a.value ?? "" }),
  set_theme: (a) => ({ ui: "theme", theme: a.theme }),
  tour_page: () => ({ ui: "tour" }),
  find_on_page: (a) => ({ ui: "find", text: a.text }),
  highlight: (a) => ({ ui: "highlight", label: a.label }),
  voice_settings: (a) => ({ ui: "voice", muted: a.muted === "true" ? true : a.muted === "false" ? false : null, speed: a.speed || null }),
  open_profile: (a) => ({ ui: "open-profile", network: a.network }),
};

/** Run one tool call from the voice model and return what it should know about the result. */
async function runTool(name: string, args: Record<string, string>): Promise<object> {
  if (name === "ask_abi") {
    abi.setLive("thinking");
    await send(String(args.question ?? ""));
    const last = [...chat.messages].reverse().find((m) => m.role === "assistant");
    const answer = last ? messageText(last).slice(0, 3000) : "";
    return answer ? { answer, shown_in_chat: true } : { error: "ABI couldn't answer that right now." };
  }
  if (name === "end_conversation") {
    ending = true;
    if (live) window.setTimeout(() => sendEvent({ type: "session.close", event_id: "bye" }), 2500);
    window.setTimeout(() => ending && abi.stopLive(), 6000);
    return { ok: true, note: "Say a short goodbye." };
  }
  if (name === "summarize_page") return { page: window.location.pathname, text: pageText(3500) };
  const make = UI[name];
  if (!make) return { error: `Unknown tool ${name}` };
  const output = make(args);
  if (name === "tour_page") void runAction({ tool: name, input: args, output });
  else await runAction({ tool: name, input: args, output });
  return { ok: true, page: window.location.pathname };
}

interface OutputItem {
  type: string;
  name?: string;
  call_id?: string;
  arguments?: string;
}

async function onToolCalls(items: OutputItem[]) {
  const calls = items.filter((i) => i.type === "function_call" && i.call_id && !handled.has(i.call_id));
  if (!calls.length) return;
  for (const call of calls) {
    handled.add(call.call_id!);
    let args: Record<string, string> = {};
    try {
      args = JSON.parse(call.arguments || "{}");
    } catch {}
    const result = await runTool(call.name ?? "", args).catch(() => ({ error: "That didn't work." }));
    if (!isOn()) return;
    sendEvent({ type: "conversation.item.create", item: { type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) } });
  }
  sendEvent({ type: "response.create" });
}

function onEvent(raw: MessageEvent) {
  let e: Record<string, unknown> & { type: string };
  try {
    e = JSON.parse(String(raw.data));
  } catch {
    return;
  }
  switch (e.type) {
    case "input_audio_buffer.speech_started":
      abi.setLive("hearing");
      break;
    case "input_audio_buffer.speech_stopped":
      abi.setLive("thinking");
      break;
    case "input_audio_buffer.committed":
      // A placeholder keeps the visitor's words above ABI's reply; the transcript fills it in.
      addMessage("user", "...", String(e.item_id));
      break;
    case "conversation.item.input_audio_transcription.completed":
      setMessage(String(e.item_id), String(e.transcript ?? "").trim());
      break;
    case "response.output_audio_transcript.delta":
      caption += String(e.delta ?? "");
      abi.setVoice({ caption: caption.length > 180 ? `...${caption.slice(-177)}` : caption });
      break;
    case "response.output_audio_transcript.done":
      if (String(e.transcript ?? "").trim()) addMessage("assistant", String(e.transcript).trim());
      caption = "";
      break;
    case "output_audio_buffer.started":
      abi.setLive("speaking");
      abi.setVoice({ speaking: true });
      break;
    case "output_audio_buffer.stopped":
    case "output_audio_buffer.cleared":
      abi.setVoice({ speaking: false, caption: "" });
      if (ending) abi.stopLive();
      else if (isOn() && abi.get().live !== "thinking") abi.setLive("listening");
      break;
    case "response.done": {
      const response = e.response as { output?: OutputItem[] } | undefined;
      void onToolCalls(response?.output ?? []);
      break;
    }
    case "error": {
      const message = (e.error as { message?: string } | undefined)?.message;
      if (message) abi.setVoice({ caption: message.slice(0, 160) });
      break;
    }
  }
}

function flushHeard() {
  if (heard.trim()) setMessage(heardId, heard.trim());
  heard = "";
  heardId = "";
}

function flushSaid() {
  if (said.trim()) addMessage("assistant", said.trim());
  said = "";
  caption = "";
}

/** GPT-Live events: transcripts, the backend's tool calls, and the end of the session. */
function onLiveEvent(raw: MessageEvent) {
  let e: Record<string, unknown> & { type: string };
  try {
    e = JSON.parse(String(raw.data));
  } catch {
    return;
  }
  switch (e.type) {
    case "session.started":
      abi.setLive("listening");
      break;
    case "session.input_transcript.delta":
      flushSaid();
      if (!heardId) {
        heardId = crypto.randomUUID();
        addMessage("user", "...", heardId);
      }
      heard += String(e.delta ?? "");
      setMessage(heardId, heard.trim() || "...");
      abi.setLive("hearing");
      break;
    case "session.output_transcript.delta":
      flushHeard();
      said += String(e.delta ?? "");
      caption = said;
      abi.setVoice({ speaking: true, caption: said.length > 180 ? `...${said.slice(-177)}` : said });
      abi.setLive("speaking");
      // GPT-Live sends no "finished speaking" event: a short silence in the transcript ends the turn.
      window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(() => {
        flushSaid();
        abi.setVoice({ speaking: false, caption: "" });
        if (ending) abi.stopLive();
        else if (isOn()) abi.setLive("listening");
      }, 1400);
      break;
    case "response.event": {
      const inner = e.event as { type?: string; item?: OutputItem } | undefined;
      if (inner?.type === "response.output_item.done" && inner.item?.type === "function_call" && inner.item.call_id) {
        const item = inner.item;
        if (handled.has(item.call_id!)) break;
        handled.add(item.call_id!);
        let args: Record<string, string> = {};
        try {
          args = JSON.parse(item.arguments || "{}");
        } catch {}
        pendingCalls.push(
          runTool(item.name ?? "", args)
            .catch(() => ({ error: "That didn't work." }))
            .then((result) => {
              sendEvent({ type: "response.item.create", event_id: `out_${item.call_id}`, item: { type: "function_call_output", call_id: item.call_id, output: JSON.stringify(result) } });
              return result;
            }),
        );
      } else if ((inner?.type === "response.completed" || inner?.type === "response.done") && pendingCalls.length) {
        const calls = pendingCalls;
        pendingCalls = [];
        void Promise.all(calls).then(() => isOn() && sendEvent({ type: "response.create", event_id: `go_${Date.now()}` }));
      }
      break;
    }
    case "session.closed":
      abi.stopLive();
      break;
    case "error": {
      const message = (e.error as { message?: string } | undefined)?.message;
      if (message) abi.setVoice({ caption: message.slice(0, 160) });
      break;
    }
  }
}

async function iceGathered(conn: RTCPeerConnection) {
  if (conn.iceGatheringState === "complete") return;
  await new Promise<void>((resolve) => {
    const done = () => conn.iceGatheringState === "complete" && resolve();
    conn.addEventListener("icegatheringstatechange", done);
    window.setTimeout(resolve, 2500);
  });
}

/** Start a realtime voice session. Returns false (and cleans up) if it could not start. */
export async function startRealtime(): Promise<boolean> {
  if (pc) return true;
  if (isLiveModel(powerStore.get().power?.realtimeModel ?? "")) return startGptLive();
  abi.setLive("starting");
  ending = false;
  try {
    const tokenRes = await fetch("/api/power/realtime", { method: "POST" });
    const token = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(token.error ?? "Couldn't start realtime voice.");

    pc = new RTCPeerConnection();
    speaker = new Audio();
    speaker.autoplay = true;
    pc.ontrack = (ev) => {
      if (speaker) speaker.srcObject = ev.streams[0];
    };
    speaker.muted = abi.get().voiceMuted;
    mic = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    pc.addTrack(mic.getTracks()[0], mic);
    dc = pc.createDataChannel("oai-events");
    dc.onmessage = onEvent;
    dc.onopen = () => {
      // Tell the voice model where the visitor is, then listen.
      sendEvent({
        type: "conversation.item.create",
        item: { type: "message", role: "system", content: [{ type: "input_text", text: `The visitor is on the page ${window.location.pathname}.` }] },
      });
      abi.setLive("listening");
    };
    pc.onconnectionstatechange = () => {
      if (pc && (pc.connectionState === "failed" || pc.connectionState === "closed")) abi.stopLive();
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const sdp = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      body: offer.sdp,
      headers: { Authorization: `Bearer ${token.value}`, "Content-Type": "application/sdp" },
    });
    if (!sdp.ok) throw new Error("OpenAI refused the voice connection.");
    await pc.setRemoteDescription({ type: "answer", sdp: await sdp.text() });
    if (abi.get().live === "off") {
      stopRealtime();
      return true;
    }
    return true;
  } catch (err) {
    stopRealtime();
    if (abi.get().live === "off") return true;
    abi.setVoice({ caption: `${(err as Error).message || "Realtime voice failed."} Using the normal voice loop.` });
    abi.setLive("starting");
    return false;
  }
}

/** GPT-Live: the server opens the session from our offer and hands back OpenAI's answer. */
async function startGptLive(): Promise<boolean> {
  abi.setLive("starting");
  ending = false;
  live = true;
  try {
    pc = new RTCPeerConnection();
    speaker = new Audio();
    speaker.autoplay = true;
    pc.ontrack = (ev) => {
      if (speaker) speaker.srcObject = ev.streams[0];
    };
    speaker.muted = abi.get().voiceMuted;
    mic = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    pc.addTrack(mic.getTracks()[0], mic);
    dc = pc.createDataChannel("oai-events");
    dc.onmessage = onLiveEvent;
    pc.onconnectionstatechange = () => {
      if (pc && (pc.connectionState === "failed" || pc.connectionState === "closed")) abi.stopLive();
    };
    await pc.setLocalDescription(await pc.createOffer());
    await iceGathered(pc);
    const res = await fetch("/api/power/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sdp: pc.localDescription?.sdp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Couldn't start GPT-Live.");
    if (!pc) return true; // ended while connecting
    await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
    return true;
  } catch (err) {
    stopRealtime();
    if (abi.get().live === "off") return true;
    abi.setVoice({ caption: `${(err as Error).message || "GPT-Live failed."} Using the normal voice loop.` });
    abi.setLive("starting");
    return false;
  }
}

/** Cut ABI off mid-sentence (the Skip button). */
export function interruptRealtime() {
  if (!isOn() || live) return; // GPT-Live hears the visitor talk over it by itself
  sendEvent({ type: "response.cancel" });
  sendEvent({ type: "output_audio_buffer.clear" });
}

export function stopRealtime() {
  dc?.close();
  pc?.getSenders().forEach((s) => s.track?.stop());
  pc?.close();
  mic?.getTracks().forEach((t) => t.stop());
  if (speaker) speaker.srcObject = null;
  pc = dc = mic = speaker = null;
  window.clearTimeout(quietTimer);
  if (live) {
    flushHeard();
    flushSaid();
  }
  live = false;
  pendingCalls = [];
  caption = "";
  ending = false;
  handled.clear();
  abi.setVoice({ speaking: false, caption: "" });
}

// Ending live mode from anywhere (End button, closing the panel, "bye") closes the session.
abi.subscribe(() => {
  if (abi.get().live === "off" && pc) stopRealtime();
  if (speaker) speaker.muted = abi.get().voiceMuted; // mute applies mid-conversation too
});
