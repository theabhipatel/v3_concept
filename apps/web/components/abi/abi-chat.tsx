"use client";

import { useChat } from "@ai-sdk/react";
import { ArrowUp, AudioLines, Briefcase, Code2, GitCompare, Loader2, Mic, Sparkles, Square, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { profile } from "@/lib/content";
import { cn } from "@/lib/utils";
import { abi, useAbi, type LiveState } from "./abi-store";
import { interruptLive } from "./live";
import { GenerativeUI } from "./generative";
import { HowIAnswered } from "./how-i-answered";
import { chat, send, type AbiData, type AbiMessage } from "./runtime";
import { declineConsent, grantConsent, toggleListening, useNeedsConsent, voiceSupported } from "./voice";

const STARTERS = [
  { q: "Show me his AI projects", icon: Sparkles, tag: "Projects" },
  { q: "What does he do at IBR Infotech?", icon: UserRound, tag: "Career" },
  { q: "Compare Secure Vault and Pushable.ai", icon: GitCompare, tag: "Compare" },
  { q: "Show me real code from Secure Vault", icon: Code2, tag: "Code" },
];
const JD_PREFIX = "Here is a job description. How well does Abhishek fit?\n\n";
const STAGES = ["Reading your question", "Working on it", "Thinking", "Taking action", "Writing"];

function data<K extends keyof AbiData>(m: AbiMessage, key: K): AbiData[K] | undefined {
  const part = m.parts.find((p) => p.type === `data-${key}`) as { data: AbiData[K] } | undefined;
  return part?.data;
}

function withCitationLinks(text: string) {
  // [3] -> a link the renderer turns into a citation chip
  return text.replace(/\[(\d+)\](?!\()/g, "[$1](#abi-source-$1)");
}

function MessageText({ text, sources }: { text: string; sources?: AbiData["retrieval"]["sources"] }) {
  return (
    <div className="abi-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href = "", children }) => {
            const m = href.match(/^#abi-source-(\d+)$/);
            if (m) {
              const src = sources?.find((s) => s.n === Number(m[1]));
              return src ? (
                <Link href={src.url} title={src.title} className="mx-0.5 inline-grid min-w-5 place-items-center rounded-md bg-abi-soft px-1 align-super font-mono text-[10px] text-abi-text no-underline">
                  {m[1]}
                </Link>
              ) : null;
            }
            const internal = href.startsWith("/");
            return internal ? <Link href={href}>{children}</Link> : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
          },
        }}
      >
        {withCitationLinks(text)}
      </ReactMarkdown>
    </div>
  );
}

function stageOf(m: AbiMessage | undefined) {
  if (!m || m.role !== "assistant") return 1;
  if (m.parts.some((p) => p.type === "text" && p.text)) return 4;
  if (m.parts.some((p) => p.type === "data-ui")) return 3;
  if (m.parts.some((p) => p.type === "data-retrieval")) return 2;
  return 1;
}

function Thinking({ stage }: { stage: number }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <Loader2 className="size-4 animate-spin text-abi-text" aria-hidden />
      {STAGES[stage]}...
    </p>
  );
}

function AssistantMessage({ message, last, busy }: { message: AbiMessage; last: boolean; busy: boolean }) {
  const retrieval = data(message, "retrieval");
  const trace = data(message, "trace");
  const suggestions = data(message, "suggestions");
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  const cited = useMemo(() => new Set([...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]))), [text]);
  return (
    <div className="space-y-3">
      {message.parts.map((part, i) => {
        if (part.type === "data-ui") return <GenerativeUI key={i} action={part.data} />;
        if (part.type === "text" && part.text) return <MessageText key={i} text={part.text} sources={retrieval?.sources} />;
        return null;
      })}
      {(!busy || !last) && <HowIAnswered retrieval={retrieval} trace={trace} cited={cited} />}
      {last && !busy && suggestions && (
        <div className="flex flex-wrap gap-2">
          {suggestions.questions.map((q) => (
            <button key={q} type="button" onClick={() => void send(q)} className="rounded-full border bg-card px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-abi/40 hover:text-foreground">
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const LIVE_TEXT: Record<LiveState, string> = {
  off: "",
  starting: "Starting the microphone...",
  listening: "Listening. Just talk.",
  hearing: "Hearing you...",
  thinking: "Thinking...",
  speaking: "Speaking",
  error: "Microphone unavailable",
};

/** The live conversation bar: replaces the composer while the hands-free loop runs. */
function LiveBar() {
  const live = useAbi((s) => s.live);
  const caption = useAbi((s) => s.caption);
  return (
    <div className="border-t p-3" role="region" aria-label="Live conversation">
      <div className="flex items-center gap-3 rounded-2xl border border-abi/40 bg-card p-2 pl-3 shadow-sm">
        <span className="live-wave" data-state={live} aria-hidden>
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <div className="min-w-0 flex-1" role="status" aria-live="polite">
          <p className="text-sm font-semibold text-abi-text">{LIVE_TEXT[live]}</p>
          <p className="truncate text-xs text-muted-foreground">
            {caption || (live === "error" ? "Check the browser permission and try again." : "Voice becomes text, nothing is stored.")}
          </p>
        </div>
        {live === "speaking" && (
          <Button type="button" size="sm" variant="ghost" onClick={interruptLive}>
            Skip
          </Button>
        )}
        <Button type="button" size="icon" variant="secondary" onClick={() => abi.stopLive()} aria-label="End live conversation" title="End live conversation">
          <X aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function VoiceConsent() {
  return (
    <div className="space-y-2 rounded-2xl border border-abi/30 bg-abi-soft p-4 text-sm" role="dialog" aria-label="Microphone permission">
      <p className="font-medium text-foreground">Talk to ABI with your voice?</p>
      <p className="text-xs text-muted-foreground">
        Your voice is converted to text to answer you, then discarded. Nothing is recorded or stored. Hold Space or the mic
        button to talk, release to send.
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="abi" onClick={grantConsent}>Allow microphone</Button>
        <Button size="sm" variant="ghost" onClick={declineConsent}>Not now</Button>
      </div>
    </div>
  );
}

export function AbiChat({ layout = "panel" }: { layout?: "panel" | "page" }) {
  const { messages, status, stop, error, clearError } = useChat<AbiMessage>({ chat, throttle: 40 });
  const [input, setInput] = useState("");
  const listening = useAbi((s) => s.listening);
  const caption = useAbi((s) => s.caption);
  const live = useAbi((s) => s.live) !== "off";
  const needsConsent = useNeedsConsent();
  const jdMode = useAbi((s) => s.jdMode);
  const setJdMode = abi.setJdMode;
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const last = messages[messages.length - 1];

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (jdMode) inputRef.current?.focus();
  }, [jdMode]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    clearError();
    void send(jdMode ? JD_PREFIX + text : text);
    setInput("");
    setJdMode(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scroller} className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5" aria-live="polite">
        {messages.length === 0 && (
          <div className={cn("space-y-5", layout === "page" && "mx-auto max-w-2xl pt-6")}>
            <div className="space-y-2">
              <p className="font-display text-xl font-semibold">Hi, I&apos;m ABI (Abhi&apos;s Brain Interface).</p>
              <p className="text-sm text-muted-foreground">
                Ask me anything about {profile.name.split(" ")[0]}&apos;s work, or ask me to operate this site for you. Every
                answer is grounded in real data and cites its sources.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {STARTERS.map((s, i) =>
                layout === "page" ? (
                  <button
                    key={s.q}
                    type="button"
                    onClick={() => void send(s.q)}
                    style={{ "--i": i } as React.CSSProperties}
                    className="starter group flex flex-col items-start gap-3 rounded-2xl border bg-background/60 p-4 text-left text-sm"
                  >
                    <span className="flex w-full items-center gap-2 text-xs font-medium text-subtle-foreground">
                      <span className="starter__icon grid size-8 place-items-center rounded-xl">
                        <s.icon className="size-4" aria-hidden />
                      </span>
                      {s.tag}
                      <ArrowUp className="ml-auto size-4 rotate-45 opacity-0 transition-all group-hover:opacity-100" aria-hidden />
                    </span>
                    <span className="font-medium text-foreground">{s.q}</span>
                  </button>
                ) : (
                  <button key={s.q} type="button" onClick={() => void send(s.q)} className="rounded-2xl border bg-card px-4 py-3 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:border-abi/40 hover:text-foreground">
                    {s.q}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setJdMode(true);
                inputRef.current?.focus();
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-abi/30 bg-abi-soft px-4 py-3 text-left text-sm"
            >
              <Briefcase className="size-5 shrink-0 text-abi-text" aria-hidden />
              <span>
                <span className="font-medium text-foreground">Hiring?</span>{" "}
                <span className="text-muted-foreground">Paste a job description and I&apos;ll show you why Abhishek fits.</span>
              </span>
            </button>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("").replace(JD_PREFIX, "Job description:\n")}
              </p>
            </div>
          ) : (
            <AssistantMessage key={m.id} message={m} last={i === messages.length - 1} busy={busy} />
          ),
        )}

        {busy && <Thinking stage={last?.role === "user" ? 1 : stageOf(last)} />}
        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
            ABI is resting right now ({error.message.includes("429") || error.message.includes("Too many") ? "too many messages" : "connection problem"}). Try again in a minute, or use the{" "}
            <Link href="/contact" className="font-medium underline">contact form</Link>.
          </div>
        )}
        {needsConsent && <VoiceConsent />}
      </div>

      {!live && (listening || caption) && (
        <p className="border-t bg-abi-soft px-4 py-2 text-center text-sm text-abi-text" role="status" aria-live="assertive">
          {listening ? "Listening... release to send" : caption}
        </p>
      )}

      {live ? (
        <LiveBar />
      ) : (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t p-3"
      >
        {jdMode && (
          <p className="mb-2 flex items-center gap-2 px-1 text-xs text-abi-text">
            <Briefcase className="size-3.5" aria-hidden /> Job description mode
            <button type="button" className="ml-auto text-subtle-foreground underline" onClick={() => setJdMode(false)}>cancel</button>
          </p>
        )}
        <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
          <label htmlFor="abi-input" className="sr-only">Message ABI</label>
          <textarea
            id="abi-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={jdMode ? 5 : 1}
            maxLength={6000}
            placeholder={jdMode ? "Paste the job description here..." : "Ask ABI anything..."}
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-subtle-foreground"
          />
          {voiceSupported() && (
            <Button type="button" size="icon" variant={listening ? "abi" : "ghost"} onClick={toggleListening} aria-label={listening ? "Stop and send voice" : "Talk to ABI"}>
              <Mic aria-hidden />
            </Button>
          )}
          {busy ? (
            <Button type="button" size="icon" variant="secondary" onClick={() => void stop()} aria-label="Stop ABI">
              <Square aria-hidden />
            </Button>
          ) : input.trim() || !voiceSupported() ? (
            <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send">
              <ArrowUp aria-hidden />
            </Button>
          ) : (
            <Button type="button" size="icon" onClick={() => abi.startLive()} aria-label="Start live conversation" title="Live conversation: talk hands-free">
              <AudioLines aria-hidden />
            </Button>
          )}
        </div>
      </form>
      )}
    </div>
  );
}
