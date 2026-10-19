"use client";

// One shared ABI conversation for the whole visit (side panel and /abi page use the same chat).
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { isPowered, powerStore } from "@/components/power/power-store";
import { abi, getSessionId, setSessionId } from "./abi-store";
import { clickLabel, control, navigateTo, runAction, scrollPage, searchFor, themeTo, tourPage, typeInto, type UiAction } from "./actions";
import { parseCommand, type Command } from "./commands";
import { configureLive, startLive } from "./live";
import { configureVoice, speak, startListening, stopSpeaking } from "./voice";

export interface Source {
  n: number;
  title: string;
  url: string;
  kind: string;
}

export type AbiData = {
  retrieval: { query: string; sources: Source[] };
  ui: UiAction;
  suggestions: { questions: string[] };
  trace: { model: string; query: string; tools: string[]; sources: number; guard?: number; ms: number };
};

export type AbiMessage = UIMessage<never, AbiData>;

let voiceTurn = false;

export function messageText(m: AbiMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

export const chat = new Chat<AbiMessage>({
  id: getSessionId(),
  transport: new DefaultChatTransport({
    api: "/api/agent/chat",
    // The agent keeps the conversation (Postgres checkpoints), so only the new message is sent.
    // In power mode the website's own route adds the user's OpenAI key on the server.
    prepareSendMessagesRequest: ({ messages }) => ({
      api: isPowered() ? "/api/power/chat" : "/api/agent/chat",
      body: { sessionId: getSessionId(), message: messageText(messages[messages.length - 1]) },
    }),
  }),
  onData: (part) => {
    if (part.type === "data-ui") void runAction(part.data);
  },
  onFinish: ({ message }) => {
    if (voiceTurn) speak(messageText(message));
    voiceTurn = false;
    persist();
  },
});

let saveTimer: number | undefined;

/** Signed-in users: save the conversation to their account (debounced, after each answer). */
export function persist() {
  if (!powerStore.get().user) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    const messages = chat.messages.filter((m) => m.parts.length);
    if (!messages.some((m) => m.role === "user")) return;
    void fetch(`/api/me/conversations/${getSessionId()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      keepalive: true,
    }).catch(() => undefined);
  }, 800);
}

/** Reopen a saved conversation: its messages come back and the agent's memory continues. */
async function resume(id: string) {
  const res = await fetch(`/api/me/conversations/${id}`, { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return;
  const data = (await res.json()) as { messages: AbiMessage[] };
  if (chat.status === "streaming" || chat.status === "submitted") await chat.stop();
  setSessionId(id);
  chat.messages = data.messages;
}

const SCROLL_TEXT = { little: "a little", more: "a bit more", page: "one screen", end: "" } as const;

/** Run a page command instantly in the browser and note it in the chat. Costs no tokens. */
async function runCommand(cmd: Command, text: string, voice: boolean) {
  const note = (reply: string) => {
    const id = () => crypto.randomUUID();
    chat.messages = [
      ...chat.messages,
      { id: id(), role: "user", parts: [{ type: "text", text }] },
      { id: id(), role: "assistant", parts: [{ type: "text", text: reply }] },
    ];
    if (voice) speak(reply);
    persist();
  };
  switch (cmd.kind) {
    case "navigate":
      note(`Opening ${cmd.label}.`);
      await navigateTo(cmd.path);
      return;
    case "scroll":
      note(
        cmd.amount === "end"
          ? `Scrolling to the ${cmd.direction === "up" ? "top" : "bottom"}.`
          : `Scrolling ${cmd.direction} ${SCROLL_TEXT[cmd.amount]}.`,
      );
      await scrollPage(cmd.direction, cmd.amount);
      return;
    case "tour":
      note("Here is the whole page, top to bottom. Say stop anytime.");
      void tourPage(); // not awaited, so live mode keeps listening for "stop"
      return;
    case "stop":
      note(await control("stop"));
      return;
    case "control":
      note(await control(cmd.action, cmd.value));
      return;
    case "type":
      note((await typeInto(cmd.field, cmd.text)) ? `Typed into ${cmd.field}.` : `I couldn't find a "${cmd.field}" field on this page.`);
      return;
    case "search":
      note((await searchFor(cmd.text)) ? `Searching for "${cmd.text}".` : "I couldn't open search.");
      return;
    case "back":
      note("Going back.");
      window.history.back();
      return;
    case "theme":
      note(`Switching to the ${cmd.theme} theme.`);
      await themeTo(cmd.theme);
      return;
    case "click": {
      const result = await clickLabel(cmd.label);
      if (result === "ok") note(`Clicking "${cmd.label}".`);
      else if (result === "missing") note(`I couldn't find "${cmd.label}" on this page. Try the exact text on the button.`);
      else note(`That opens another site, so your browser wants you to click it: [${cmd.label}](${result.external})`);
    }
  }
}

export async function send(text: string, voice = false) {
  const clean = text.trim();
  if (!clean) return;
  stopSpeaking();
  if (chat.status === "streaming" || chat.status === "submitted") await chat.stop();
  const cmd = parseCommand(clean);
  if (cmd) return runCommand(cmd, clean, voice);
  voiceTurn = voice;
  await chat.sendMessage({ text: clean });
}

configureLive((text) => send(text, true));

// A link to another site that the browser would not let ABI open: hand it to the visitor.
if (typeof window !== "undefined")
  window.addEventListener("abi:external-link", (e) => {
    const href = String((e as CustomEvent).detail);
    chat.messages = [
      ...chat.messages,
      { id: crypto.randomUUID(), role: "assistant", parts: [{ type: "text", text: `Your browser wants you to open this one yourself: [${href}](${href})` }] },
    ];
    persist();
  });

configureVoice({
  onText: (text) => void send(text, true),
  onInterrupt: () => {
    if (chat.status === "streaming" || chat.status === "submitted") void chat.stop();
  },
});

// Consume questions queued from anywhere on the site, and push-to-talk requests.
function drain() {
  const resumeId = abi.get().resumeRequested;
  if (resumeId) {
    abi.clearResume();
    void resume(resumeId);
  }
  for (const req of abi.take()) void send(req.text, req.voice);
  if (abi.get().liveRequested) {
    abi.clearLiveRequest();
    void startLive();
  }
  if (abi.get().listenRequested) {
    abi.clearListen();
    void startListening();
  }
}
abi.subscribe(drain);
drain();
