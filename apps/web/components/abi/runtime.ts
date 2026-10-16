"use client";

// One shared ABI conversation for the whole visit (side panel and /abi page use the same chat).
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { abi, getSessionId } from "./abi-store";
import { clickLabel, navigateTo, runAction, scrollPage, themeTo, type UiAction } from "./actions";
import { parseCommand, type Command } from "./commands";
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
    prepareSendMessagesRequest: ({ messages }) => ({
      body: { sessionId: getSessionId(), message: messageText(messages[messages.length - 1]) },
    }),
  }),
  onData: (part) => {
    if (part.type === "data-ui") void runAction(part.data);
  },
  onFinish: ({ message }) => {
    if (voiceTurn) speak(messageText(message));
    voiceTurn = false;
  },
});

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
    case "back":
      note("Going back.");
      window.history.back();
      return;
    case "theme":
      note(`Switching to the ${cmd.theme} theme.`);
      await themeTo(cmd.theme);
      return;
    case "click": {
      if (await clickLabel(cmd.label)) {
        note(`Clicking "${cmd.label}".`);
        return;
      }
      const reply = `I couldn't find "${cmd.label}" on this page. Try the exact text on the button.`;
      note(reply);
      if (voice) speak(reply);
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

configureVoice({
  onText: (text) => void send(text, true),
  onInterrupt: () => {
    if (chat.status === "streaming" || chat.status === "submitted") void chat.stop();
  },
});

// Consume questions queued from anywhere on the site, and push-to-talk requests.
function drain() {
  for (const req of abi.take()) void send(req.text, req.voice);
  if (abi.get().listenRequested) {
    abi.clearListen();
    void startListening();
  }
}
abi.subscribe(drain);
drain();
