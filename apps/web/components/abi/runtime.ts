"use client";

// One shared ABI conversation for the whole visit (side panel and /abi page use the same chat).
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { abi, getSessionId } from "./abi-store";
import { runAction, type UiAction } from "./actions";
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

export async function send(text: string, voice = false) {
  const clean = text.trim();
  if (!clean) return;
  stopSpeaking();
  if (chat.status === "streaming" || chat.status === "submitted") await chat.stop();
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
