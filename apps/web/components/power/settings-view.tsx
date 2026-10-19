"use client";

import { AudioLines, Check, Cpu, KeyRound, Loader2, Lock, LogOut, MessagesSquare, Mic, Power, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { abi } from "@/components/abi/abi-store";
import { authClient } from "@/lib/auth-client";
import {
  DEFAULT_LIVE_VOICE,
  DEFAULT_MAIN_MODEL,
  DEFAULT_REALTIME_MODEL,
  DEFAULT_VOICE,
  familyOf,
  formatPrice,
  isLiveModel,
  LIVE_VOICES,
  VOICES,
  type ModelOption,
  type PowerSettings,
} from "@/lib/openai-models";
import { cn } from "@/lib/utils";
import { powerStore, usePower } from "./power-store";
import { centerOf, surge } from "./surge";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}

function Card({ id, icon: Icon, title, text, children, className }: { id: string; icon: typeof Power; title: string; text: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={`${id}-title`} className={cn("rounded-[1.75rem] border bg-card p-5 sm:p-7", className)}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand/12 text-brand-text">
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <div>
          <h2 id={`${id}-title`} className="text-lg font-bold tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

// ---------- The power switch ----------

function PowerSwitch({ power }: { power: PowerSettings }) {
  const btn = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const on = power.enabled;

  async function toggle() {
    if (busy) return;
    if (!power.hasKey) {
      setNote("Add your OpenAI key below first.");
      btn.current?.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 260 });
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const { power: next } = await api<{ power: PowerSettings }>("/api/me/settings", { method: "PATCH", body: JSON.stringify({ enabled: !on }) });
      if (btn.current) {
        const [x, y] = centerOf(btn.current);
        surge(x, y, next.enabled ? "surge" : "down", btn.current.offsetWidth / 2);
      }
      powerStore.setPower(next);
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-motion className="power-panel relative overflow-hidden rounded-[2rem] border bg-card p-6 sm:p-10" data-on={on || undefined}>
      <span className="power-panel__grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
        <button
          ref={btn}
          type="button"
          onClick={toggle}
          aria-pressed={on}
          aria-label={on ? "Turn power mode off" : "Turn power mode on"}
          className="power-btn relative grid size-36 shrink-0 place-items-center rounded-full"
        >
          <span className="power-btn__ring" aria-hidden />
          <span className="power-btn__arc" aria-hidden />
          <span className="power-btn__face grid size-24 place-items-center rounded-full">
            {busy ? <Loader2 className="size-9 animate-spin" aria-hidden /> : <Power className="size-10" strokeWidth={2.4} aria-hidden />}
          </span>
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{on ? "Power mode" : "Normal mode"}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{on ? <span className="text-brand-text">ABI runs on OpenAI.</span> : "ABI runs on free models."}</p>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {on
              ? `Answers use ${power.mainModel}, live voice uses ${power.realtimeModel} (${isLiveModel(power.realtimeModel) ? power.liveVoice : power.voice}), all on your key. Only you get this.`
              : power.hasKey
                ? "Press the button to move chat, voice and live conversation to your OpenAI key."
                : "Add your OpenAI key, then press the button to move everything to OpenAI."}
          </p>
          {note && (
            <p role="alert" className="mt-3 text-sm font-semibold text-destructive">
              {note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- The key ----------

const STEPS = ["Checking the format", "Asking OpenAI", "Sealing it with AES-256"];

function KeyCard({ power }: { power: PowerSettings }) {
  const [key, setKey] = useState("");
  const [step, setStep] = useState(-1);
  const [failed, setFailed] = useState(-1);
  const [msg, setMsg] = useState("");
  const [replace, setReplace] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const testing = step >= 0 && failed < 0 && !msg;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setFailed(-1);
    setStep(0);
    const clean = key.trim();
    await new Promise((r) => setTimeout(r, 350));
    if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(clean)) {
      setFailed(0);
      setMsg("That doesn't look like an OpenAI key. It starts with sk-.");
      return;
    }
    setStep(1);
    try {
      const res = await api<{ models: number; hasDefault: boolean; power: PowerSettings }>("/api/me/key", { method: "POST", body: JSON.stringify({ key: clean }) });
      setStep(2);
      await new Promise((r) => setTimeout(r, 450));
      setStep(3);
      setKey("");
      setReplace(false);
      setMsg(`Key works. ${res.models} models available${res.hasDefault ? ", including GPT-6 Luna" : ""}.`);
      powerStore.setPower(res.power);
    } catch (err) {
      setFailed(1);
      setMsg((err as Error).message);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const res = await api<{ power: PowerSettings }>("/api/me/key", { method: "DELETE" });
      powerStore.setPower(res.power);
      setConfirm(false);
      setStep(-1);
      setMsg("");
    } finally {
      setDeleting(false);
    }
  }

  const showForm = !power.hasKey || replace;

  return (
    <Card id="key" icon={KeyRound} title="Your OpenAI key" text="Tested with OpenAI, encrypted before it is stored, and only ever used for you.">
      {power.hasKey && !replace && (
        <div className="key-saved flex flex-wrap items-center gap-3 rounded-2xl border bg-background/60 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-success/15 text-success">
            <Lock className="size-4" aria-hidden />
          </span>
          <span className="min-w-[11rem] flex-1">
            <span className="block font-mono text-sm font-semibold">{power.keyHint}</span>
            <span className="block text-xs text-muted-foreground">Saved and encrypted. The full key never comes back to your browser.</span>
          </span>
          {!confirm ? (
            <span className="flex basis-full gap-2 sm:basis-auto">
              <button type="button" onClick={() => setReplace(true)} className="h-9 rounded-full border px-4 text-sm font-semibold transition-colors hover:bg-muted">
                Replace
              </button>
              <button type="button" onClick={() => setConfirm(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-destructive/40 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10">
                <Trash2 className="size-3.5" aria-hidden /> Delete key
              </button>
            </span>
          ) : (
            <span className="flex w-full flex-wrap items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm sm:w-auto">
              <span className="mr-1">Delete it for good? Power mode turns off.</span>
              <button type="button" disabled={deleting} onClick={remove} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-destructive px-3 font-semibold text-white disabled:opacity-60">
                {deleting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Trash2 className="size-3.5" aria-hidden />} Delete
              </button>
              <button type="button" onClick={() => setConfirm(false)} className="h-8 rounded-full border bg-card px-3 font-semibold">
                Cancel
              </button>
            </span>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={save} className="space-y-4">
          <div className="field">
            <input
              id="openai-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder=" "
              className="field__input font-mono"
            />
            <label htmlFor="openai-key" className="field__label">
              OpenAI API key (sk-...)
            </label>
            <span className="field__glow" aria-hidden />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={testing || key.trim().length < 10} className="send group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full px-5 text-sm font-semibold disabled:opacity-60">
              {testing ? <Loader2 className="relative size-4 animate-spin" aria-hidden /> : <ShieldCheck className="relative size-4" aria-hidden />}
              <span className="relative">Test and save</span>
            </button>
            {replace && (
              <button type="button" onClick={() => setReplace(false)} className="h-11 rounded-full border px-5 text-sm font-semibold hover:bg-muted">
                Cancel
              </button>
            )}
          </div>
          <p className="text-xs text-subtle-foreground">
            Create one at platform.openai.com/api-keys. Usage is billed to your OpenAI account; set a budget there.
          </p>
        </form>
      )}

      {step >= 0 && (
        <ol className="key-steps mt-5 space-y-2" aria-live="polite">
          {STEPS.map((s, i) => {
            const state = failed === i ? "fail" : step > i || step === 3 ? "done" : step === i && failed < 0 ? "run" : "wait";
            return (
              <li key={s} className="key-step flex items-center gap-3 text-sm" data-state={state}>
                <span className="key-step__dot grid size-6 place-items-center rounded-full">
                  {state === "done" ? <Check className="size-3.5" aria-hidden /> : state === "fail" ? <X className="size-3.5" aria-hidden /> : state === "run" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
                </span>
                {s}
              </li>
            );
          })}
        </ol>
      )}
      {msg && <p className={cn("mt-3 text-sm font-semibold", failed >= 0 ? "text-destructive" : "text-success")}>{msg}</p>}
    </Card>
  );
}

// ---------- Models and voice ----------

type Tab = "main" | "voice-model" | "voice";
type Models = { main: ModelOption[]; realtime: ModelOption[] };

function Price({ o, unit }: { o: ModelOption; unit: string }) {
  if (o.perMinute)
    return (
      <span className="flex text-[11px] font-semibold">
        <span className="price-chip">{formatPrice(o.perMinute)} per minute</span>
      </span>
    );
  if (!o.price) return <span className="text-xs text-subtle-foreground">Price not listed</span>;
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
      <span className="price-chip">In {formatPrice(o.price.input)}</span>
      {o.price.cached !== null && <span className="price-chip price-chip--soft">Cached {formatPrice(o.price.cached)}</span>}
      <span className="price-chip">Out {formatPrice(o.price.output)}</span>
      <span className="font-medium text-subtle-foreground">/ 1M {unit}</span>
    </span>
  );
}

/** One of the three "in use now" cards at the top; pressing it opens its picker below. */
function InUse({
  label,
  value,
  isDefault,
  defaultValue,
  active,
  onOpen,
  onReset,
  children,
}: {
  label: string;
  value: string;
  isDefault: boolean;
  defaultValue: string;
  active: boolean;
  onOpen: () => void;
  onReset: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="in-use relative flex flex-col gap-2 rounded-2xl border bg-background/60 p-4" data-active={active || undefined}>
      <button type="button" onClick={onOpen} className="absolute inset-0 rounded-2xl" aria-label={`Change ${label.toLowerCase()}`} />
      <span className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {isDefault ? (
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] tracking-wider text-success">Default</span>
        ) : (
          <button type="button" onClick={onReset} title={`Switch back to ${defaultValue}`} className="relative z-10 shrink-0 rounded-full border px-2 py-0.5 text-[10px] tracking-wider normal-case hover:border-brand/50 hover:text-foreground">
            Use default
          </button>
        )}
      </span>
      <span className="break-all font-mono text-lg font-bold">{value}</span>
      {children}
    </div>
  );
}

function OptionGrid({ options, value, defaultId, unit, onPick }: { options: ModelOption[]; value: string; defaultId: string; unit: string; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [family, setFamily] = useState("All");
  const [all, setAll] = useState(false);
  const families = ["All", ...new Set(options.map((o) => familyOf(o.id)))];
  const shown = options.filter((o) => (family === "All" || familyOf(o.id) === family) && o.id.includes(q.trim().toLowerCase()));
  const visible = all || q || family !== "All" ? shown : shown.slice(0, 12);
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <span className="sr-only">Search models</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${options.length} models`} className="lab-input lab-input--icon h-10 text-sm" />
        </label>
        {families.length > 2 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Model family">
            {families.map((f) => (
              <button key={f} type="button" aria-pressed={family === f} onClick={() => setFamily(f)} className="voice-chip h-8 rounded-full border px-3 text-xs font-semibold">
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
      <div role="radiogroup" aria-label="Models" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={o.id === value} onClick={() => onPick(o.id)} className="model-opt flex flex-col items-start gap-2 rounded-2xl border bg-background/50 p-4 text-left">
            <span className="flex w-full items-center gap-2">
              <span className="model-opt__radio size-4 shrink-0 rounded-full border-2" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-mono text-sm font-semibold">{o.id}</span>
              {o.id === defaultId && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">Default</span>}
            </span>
            <span className="min-h-4 text-xs text-muted-foreground">{o.note ?? familyOf(o.id)}</span>
            <Price o={o} unit={unit} />
          </button>
        ))}
      </div>
      {!shown.length && <p className="mt-4 text-sm text-muted-foreground">No models match.</p>}
      {visible.length < shown.length && (
        <button type="button" onClick={() => setAll(true)} className="mt-4 h-10 rounded-full border px-5 text-sm font-semibold hover:bg-muted">
          Show all {shown.length} models
        </button>
      )}
    </div>
  );
}

function ModelsSection({ power }: { power: PowerSettings }) {
  const [models, setModels] = useState<Models | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("main");
  const [saved, setSaved] = useState(false);
  const picker = useRef<HTMLDivElement>(null);
  const liveModel = isLiveModel(power.realtimeModel);
  const voices: readonly string[] = liveModel ? LIVE_VOICES : VOICES;
  const voice = liveModel ? power.liveVoice : power.voice;
  const defaultVoice = liveModel ? DEFAULT_LIVE_VOICE : DEFAULT_VOICE;

  useEffect(() => {
    if (!power.hasKey) return;
    let on = true;
    api<Models>("/api/me/models")
      .then((m) => on && setModels(m))
      .catch((e) => on && setError((e as Error).message));
    return () => {
      on = false;
    };
  }, [power.hasKey]);

  async function pick(patch: Partial<Pick<PowerSettings, "mainModel" | "realtimeModel" | "voice" | "liveVoice">>) {
    powerStore.setPower({ ...power, ...patch });
    try {
      const res = await api<{ power: PowerSettings }>("/api/me/settings", { method: "PATCH", body: JSON.stringify(patch) });
      powerStore.setPower(res.power);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const pickVoice = (v: string) => pick(liveModel ? { liveVoice: v } : { voice: v });
  const open = (t: Tab) => {
    setTab(t);
    picker.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const find = (list: ModelOption[] | undefined, id: string) => list?.find((o) => o.id === id);

  return (
    <section aria-labelledby="models-title" className="rounded-[1.75rem] border bg-card p-5 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand/12 text-brand-text">
          <Cpu className="size-[18px]" aria-hidden />
        </span>
        <div>
          <h2 id="models-title" className="text-lg font-bold tracking-tight">
            Models and voice
          </h2>
          <p className="text-sm text-muted-foreground">Listed live from your key, with OpenAI&apos;s prices. Changes save instantly.</p>
        </div>
      </div>

      {!power.hasKey ? (
        <p className="mt-6 rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">Add your key above to choose models.</p>
      ) : (
        <>
          <h3 className="mt-7 text-sm font-bold">In use now</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <InUse label="Main model" value={power.mainModel} isDefault={power.mainModel === DEFAULT_MAIN_MODEL} defaultValue={DEFAULT_MAIN_MODEL} active={tab === "main"} onOpen={() => open("main")} onReset={() => pick({ mainModel: DEFAULT_MAIN_MODEL })}>
              <span className="text-xs text-muted-foreground">Chat answers, tools, job match, resume</span>
              {find(models?.main, power.mainModel) && <Price o={find(models?.main, power.mainModel)!} unit="tokens" />}
            </InUse>
            <InUse label="Voice model" value={power.realtimeModel} isDefault={power.realtimeModel === DEFAULT_REALTIME_MODEL} defaultValue={DEFAULT_REALTIME_MODEL} active={tab === "voice-model"} onOpen={() => open("voice-model")} onReset={() => pick({ realtimeModel: DEFAULT_REALTIME_MODEL })}>
              <span className="text-xs text-muted-foreground">Live conversation, speech to speech</span>
              {find(models?.realtime, power.realtimeModel) && <Price o={find(models?.realtime, power.realtimeModel)!} unit="audio tokens" />}
            </InUse>
            <InUse label="Voice" value={voice} isDefault={voice === defaultVoice} defaultValue={defaultVoice} active={tab === "voice"} onOpen={() => open("voice")} onReset={() => pickVoice(defaultVoice)}>
              <span className="text-xs text-muted-foreground">{liveModel ? "GPT-Live voices" : "Realtime voices, also used for spoken answers"}</span>
            </InUse>
          </div>

          <div ref={picker} className="mt-8 scroll-mt-24">
            <div className="models-tabs relative grid grid-cols-3 rounded-full border bg-background/60 p-1" role="tablist" aria-label="Choose" style={{ "--i": ["main", "voice-model", "voice"].indexOf(tab) } as React.CSSProperties}>
              <span className="models-tabs__pill" aria-hidden />
              {(
                [
                  ["main", "Main model", Cpu],
                  ["voice-model", "Voice model", AudioLines],
                  ["voice", "Voice", Mic],
                ] as const
              ).map(([id, label, Icon]) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("relative z-10 inline-flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors", tab === id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className="hidden size-4 sm:block" aria-hidden />
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-5" role="tabpanel">
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : tab !== "voice" && !models ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Asking OpenAI which models your key can use...
                </p>
              ) : tab === "main" ? (
                <OptionGrid key="main" options={models!.main} value={power.mainModel} defaultId={DEFAULT_MAIN_MODEL} unit="tokens" onPick={(id) => pick({ mainModel: id })} />
              ) : tab === "voice-model" ? (
                <OptionGrid key="rt" options={models!.realtime} value={power.realtimeModel} defaultId={DEFAULT_REALTIME_MODEL} unit="audio tokens" onPick={(id) => pick({ realtimeModel: id })} />
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {liveModel ? `${LIVE_VOICES.length} voices for GPT-Live.` : `All ${VOICES.length} OpenAI Realtime voices. ABI's spoken answers in push-to-talk use the same voice.`}
                  </p>
                  <div role="radiogroup" aria-label="Voice" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {voices.map((v) => (
                      <button key={v} type="button" role="radio" aria-checked={v === voice} onClick={() => pickVoice(v)} className="voice-card flex h-14 items-center gap-2.5 rounded-2xl border bg-background/50 px-3 text-left text-sm font-semibold capitalize">
                        <span className="voice-card__wave" aria-hidden>
                          <i />
                          <i />
                          <i />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{v}</span>
                        {v === defaultVoice && <span className="text-[10px] font-bold uppercase text-success">Default</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-dashed bg-background/40 p-4">
            <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Embeddings: gemini-embedding-001, locked.</span> ABI&apos;s memory of
              Abhishek&apos;s work was built with this model. Another model would turn questions into numbers that don&apos;t match
              that memory, so search would find nothing.
            </p>
          </div>
        </>
      )}
      {saved && (
        <p role="status" className="saved-toast fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border bg-popover px-4 py-2 text-sm font-semibold shadow-lg">
          <Check className="mr-1 inline size-4 text-success" aria-hidden /> Saved
        </p>
      )}
    </section>
  );
}

// ---------- Conversations ----------

interface Convo {
  id: string;
  title: string;
  count: number;
  updatedAt: string;
}

function ConversationsCard() {
  const [list, setList] = useState<Convo[] | null>(null);

  useEffect(() => {
    let live = true;
    api<{ conversations: Convo[] }>("/api/me/conversations")
      .then((d) => live && setList(d.conversations))
      .catch(() => live && setList([]));
    return () => {
      live = false;
    };
  }, []);

  async function remove(id: string) {
    setList((l) => l?.filter((c) => c.id !== id) ?? null);
    await api(`/api/me/conversations/${id}`, { method: "DELETE" }).catch(() => undefined);
  }

  return (
    <Card id="convos" icon={MessagesSquare} title="Your conversations" text="Every chat with ABI is saved while you're signed in.">
      {!list ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Loading...
        </p>
      ) : !list.length ? (
        <p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">Nothing yet. Ask ABI something and it shows up here.</p>
      ) : (
        <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1" data-lenis-prevent>
          {list.map((c) => (
            <li key={c.id} className="convo flex items-center gap-3 rounded-2xl border bg-background/50 p-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{c.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {new Date(c.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} - {c.count} messages
                </span>
              </span>
              <button type="button" onClick={() => abi.resume(c.id)} className="h-9 rounded-full border px-4 text-sm font-semibold transition-colors hover:border-brand/50">
                Continue
              </button>
              <button type="button" onClick={() => remove(c.id)} className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete "${c.title}"`}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** ABI settings for a signed-in power user. */
export function SettingsView() {
  const router = useRouter();
  const ready = usePower((s) => s.ready);
  const user = usePower((s) => s.user);
  const power = usePower((s) => s.power);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    void powerStore.load(true).then(() => setChecked(true));
  }, []);
  useEffect(() => {
    // A failed confirmation link lands here with ?error=...; the sign-in page explains it.
    if (checked && ready && !user) router.replace(`/signin${window.location.search}`);
  }, [checked, ready, user, router]);

  if (!checked || !user || !power)
    return (
      <p className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading your settings...
      </p>
    );

  return (
    <div className="space-y-6">
      <div data-intro className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-text">ABI settings</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Hi, {user.name.split(" ")[0] || "there"}.</h1>
          <p className="mt-1 text-muted-foreground">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await authClient.signOut();
            powerStore.signedOut();
            router.push("/");
          }}
          className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors hover:bg-muted"
        >
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </div>
      <div data-intro style={{ "--d": 1 } as React.CSSProperties}>
        <PowerSwitch power={power} />
      </div>
      <div data-intro style={{ "--d": 2 } as React.CSSProperties} className="grid items-start gap-6 lg:grid-cols-2">
        <KeyCard power={power} />
        <ConversationsCard />
      </div>
      <div data-intro style={{ "--d": 3 } as React.CSSProperties}>
        <ModelsSection power={power} />
      </div>
    </div>
  );
}
